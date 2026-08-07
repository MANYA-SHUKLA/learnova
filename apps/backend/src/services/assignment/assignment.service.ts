import { Types } from 'mongoose';
import type { z } from 'zod';
import { EVENTS } from '@learnova/events';
import type {
  AssignmentFileUploadInput,
  AssignmentListQuery,
  CreateAssignmentInput,
  CreateCommentInput,
  CreateRubricInput,
  GradeSubmissionInput,
  SaveSubmissionDraftInput,
  SubmissionListQuery,
  SubmitAssignmentInput,
  UpdateAssignmentInput,
  UpdateRubricInput,
} from '@learnova/validation';
import {
  ASSIGNMENT_MAX_FILE_BYTES,
  type assignmentExportQuerySchema,
  type assignmentImportConfirmSchema,
} from '@learnova/validation';
import type {
  AssignmentFacultyDashboard,
  AssignmentInstitutionDashboard,
  AssignmentStatus,
  AssignmentStudentDashboard,
} from '@learnova/types';
import { eventBus } from '../../events/index.js';
import { AssignmentModel } from '../../models/assignment.model.js';
import { AssignmentGradeModel } from '../../models/assignment-grade.model.js';
import { AssignmentSubmissionModel } from '../../models/assignment-submission.model.js';
import { CourseModel } from '../../models/course.model.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { FacultyModel } from '../../models/faculty.model.js';
import { StudentModel } from '../../models/student.model.js';
import { getStorage } from '../../storage/index.js';
import { logger } from '../../utils/logger/index.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { assignmentRepository } from '../../repositories/assignment/index.js';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  ASSIGNMENT_CSV_HEADERS,
  canTransitionStatus,
  computeSubmissionRate,
  evaluateAttempt,
  evaluateSubmissionWindow,
  extensionFor,
  pageMeta,
  parseDate,
  resolveGradeOutcome,
  resolveSubmissionStatus,
  rowsToCsv,
  rubricTotalPoints,
} from './assignment.helpers.js';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

export type AssignmentExportQuery = z.infer<typeof assignmentExportQuerySchema>;
export type AssignmentImportConfirmInput = z.infer<typeof assignmentImportConfirmSchema>;

const MANAGE_ROLES = new Set(['institution_admin', 'super_admin']);

function requireTenant(actor: ActorContext): string {
  if (!actor.institutionId) {
    throw new ForbiddenError('Institution context required');
  }
  return actor.institutionId;
}

function canManage(actor: ActorContext): boolean {
  return MANAGE_ROLES.has(actor.role);
}

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function normalizeValue(value: unknown): unknown {
  if (value instanceof Types.ObjectId) return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(source)) {
      if (key === '__v') continue;
      out[key] = normalizeValue(item);
    }
    return out;
  }
  return value;
}

/** Mongo document -> API DTO: `id` string, ObjectIds stringified, dates ISO. */
function toDto(doc: {
  _id: Types.ObjectId;
  toObject?: () => Record<string, unknown>;
}): Record<string, unknown> {
  const raw =
    typeof doc.toObject === 'function'
      ? doc.toObject()
      : (doc as unknown as Record<string, unknown>);
  const { _id, __v, ...rest } = raw as Record<string, unknown> & {
    _id: Types.ObjectId;
    __v?: number;
  };

  return {
    id: String(_id),
    ...(normalizeValue(rest) as Record<string, unknown>),
  };
}

function mergeAnd(filter: Record<string, unknown>, condition: Record<string, unknown>): void {
  const existing = (filter.$and as Record<string, unknown>[] | undefined) ?? [];
  filter.$and = [...existing, condition];
}

function newFileId(): string {
  return new Types.ObjectId().toHexString();
}

interface FileRef {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  url: string | null;
  uploadedBy: Types.ObjectId | null;
  createdAt: Date;
}

export class AssignmentService {
  // ------------------------------------------------------------- actor lookups

  private async resolveStudent(actor: ActorContext, institutionId: string) {
    const student = await StudentModel.findOne({
      institutionId: oid(institutionId),
      email: actor.email.toLowerCase(),
      deletedAt: null,
    }).exec();
    if (!student) throw new NotFoundError('Student record not found');
    return student;
  }

  private async facultyCourseIds(
    actor: ActorContext,
    institutionId: string,
  ): Promise<Types.ObjectId[]> {
    const faculty = await FacultyModel.findOne({
      institutionId: oid(institutionId),
      email: actor.email.toLowerCase(),
      deletedAt: null,
    }).exec();
    if (!faculty) return [];

    const courses = await CourseModel.find({
      institutionId: oid(institutionId),
      deletedAt: null,
      $or: [{ facultyIds: faculty._id }, { coordinatorId: faculty._id }],
    })
      .select('_id')
      .exec();

    return courses.map((c) => c._id);
  }

  private async enrolledCourseIds(
    studentId: Types.ObjectId,
    institutionId: string,
  ): Promise<Types.ObjectId[]> {
    const enrollments = await EnrollmentModel.find({
      institutionId: oid(institutionId),
      studentId,
      status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
      deletedAt: null,
    })
      .select('courseId')
      .exec();

    return enrollments.map((e) => e.courseId);
  }

  /** Throws unless the student holds an active/approved/completed enrollment. */
  private async assertEnrollment(
    institutionId: string,
    studentId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<void> {
    const enrollment = await EnrollmentModel.findOne({
      institutionId: oid(institutionId),
      studentId,
      courseId,
      status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
      deletedAt: null,
    }).exec();

    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this course');
    }
  }

  // ------------------------------------------------------------- access checks

  /** Faculty may write an assignment they authored or that belongs to their course. */
  private async assertAssignmentWriteAccess(
    assignment: { createdBy?: Types.ObjectId | null; courseId: Types.ObjectId },
    actor: ActorContext,
    institutionId: string,
  ): Promise<void> {
    if (canManage(actor)) return;
    if (actor.role !== 'faculty') {
      throw new ForbiddenError('Not allowed to modify this assignment');
    }
    if (assignment.createdBy && String(assignment.createdBy) === actor.userId) return;

    const courseIds = await this.facultyCourseIds(actor, institutionId);
    if (courseIds.some((c) => String(c) === String(assignment.courseId))) return;

    throw new ForbiddenError('Not allowed to modify this assignment');
  }

  private async assertCourseWriteAccess(
    courseId: string,
    actor: ActorContext,
    institutionId: string,
  ): Promise<void> {
    if (canManage(actor)) return;
    if (actor.role !== 'faculty') {
      throw new ForbiddenError('Not allowed to create assignments for this course');
    }
    const courseIds = await this.facultyCourseIds(actor, institutionId);
    if (!courseIds.some((c) => String(c) === courseId)) {
      throw new ForbiddenError('Not allowed to create assignments for this course');
    }
  }

  /** Adds role scoping onto an assignment filter. */
  private async scopeAssignmentFilter(
    filter: Record<string, unknown>,
    actor: ActorContext,
    institutionId: string,
  ): Promise<Record<string, unknown>> {
    if (canManage(actor)) return filter;

    if (actor.role === 'faculty') {
      const courseIds = await this.facultyCourseIds(actor, institutionId);
      mergeAnd(filter, {
        $or: [
          { createdBy: oid(actor.userId) },
          { courseId: { $in: courseIds }, status: { $ne: 'draft' } },
        ],
      });
      return filter;
    }

    if (actor.role === 'student') {
      const student = await StudentModel.findOne({
        institutionId: oid(institutionId),
        email: actor.email.toLowerCase(),
        deletedAt: null,
      }).exec();
      if (!student) {
        filter._id = null;
        return filter;
      }
      const courseIds = await this.enrolledCourseIds(student._id, institutionId);
      mergeAnd(filter, { courseId: { $in: courseIds }, status: 'published' });
      return filter;
    }

    mergeAnd(filter, { status: 'published' });
    return filter;
  }

  private async assertAssignmentReadAccess(
    assignment: { createdBy?: Types.ObjectId | null; courseId: Types.ObjectId; status: string },
    actor: ActorContext,
    institutionId: string,
  ): Promise<void> {
    if (canManage(actor)) return;

    if (actor.role === 'faculty') {
      if (assignment.createdBy && String(assignment.createdBy) === actor.userId) return;
      const courseIds = await this.facultyCourseIds(actor, institutionId);
      const ownsCourse = courseIds.some((c) => String(c) === String(assignment.courseId));
      if (ownsCourse && assignment.status !== 'draft') return;
      throw new ForbiddenError('Access denied');
    }

    if (actor.role === 'student') {
      if (assignment.status !== 'published') {
        throw new ForbiddenError('Assignment is not available');
      }
      const student = await this.resolveStudent(actor, institutionId);
      await this.assertEnrollment(institutionId, student._id, assignment.courseId);
      return;
    }

    if (assignment.status !== 'published') {
      throw new ForbiddenError('Access denied');
    }
  }

  private async audit(
    event: Parameters<typeof assignmentRepository.logAudit>[0]['event'],
    actor: ActorContext,
    institutionId: string,
    payload: {
      assignmentId?: string | null;
      submissionId?: string | null;
      courseId?: string | null;
      studentId?: string | null;
      metadata?: Record<string, unknown>;
    } = {},
  ) {
    await assignmentRepository.logAudit({
      event,
      institutionId,
      assignmentId: payload.assignmentId ?? null,
      submissionId: payload.submissionId ?? null,
      courseId: payload.courseId ?? null,
      studentId: payload.studentId ?? null,
      userId: actor.userId,
      email: actor.email,
      metadata: payload.metadata,
    });
  }

  // ------------------------------------------------------------- assignments

  async create(input: CreateAssignmentInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    await this.assertCourseWriteAccess(input.courseId, actor, institutionId);

    const course = await CourseModel.findOne({
      _id: input.courseId,
      institutionId: oid(institutionId),
      deletedAt: null,
    }).exec();
    if (!course) throw new NotFoundError('Course not found');

    if (input.passingMarks > input.totalMarks) {
      throw new ValidationError('passingMarks cannot exceed totalMarks');
    }

    const dueDate = parseDate(input.dueDate);
    const closeDate = parseDate(input.closeDate);
    if (dueDate && closeDate && closeDate < dueDate) {
      throw new ValidationError('closeDate cannot be earlier than dueDate');
    }

    if (input.rubricId) {
      const rubric = await assignmentRepository.findRubricById(institutionId, input.rubricId);
      if (!rubric) throw new NotFoundError('Rubric not found');
    }

    const doc = await assignmentRepository.createAssignment({
      institutionId: oid(institutionId),
      courseId: oid(input.courseId),
      moduleId: input.moduleId ? oid(input.moduleId) : null,
      lessonId: input.lessonId ? oid(input.lessonId) : null,
      title: input.title,
      description: input.description ?? null,
      instructions: input.instructions ?? null,
      assignmentType: input.assignmentType,
      visibility: input.visibility,
      status: 'draft',
      totalMarks: input.totalMarks,
      passingMarks: input.passingMarks,
      weightage: input.weightage,
      allowLateSubmission: input.allowLateSubmission,
      latePenaltyPercent: input.latePenaltyPercent,
      allowResubmission: input.allowResubmission,
      maxAttempts: input.maxAttempts,
      publishDate: parseDate(input.publishDate),
      dueDate,
      closeDate,
      estimatedMinutes: input.estimatedMinutes ?? null,
      attachments: [],
      rubricId: input.rubricId ? oid(input.rubricId) : null,
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    await this.audit('assignment_created', actor, institutionId, {
      assignmentId: String(doc._id),
      courseId: input.courseId,
    });

    eventBus.emit(EVENTS.ASSIGNMENT_CREATED, {
      assignmentId: String(doc._id),
      courseId: input.courseId,
      institutionId,
    });

    return toDto(doc);
  }

  async list(query: AssignmentListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let filter = assignmentRepository.buildAssignmentFilter(institutionId, query);
    filter = await this.scopeAssignmentFilter(filter, actor, institutionId);

    const result = await assignmentRepository.listAssignments(filter, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async search(query: Partial<AssignmentListQuery>, actor: ActorContext) {
    return this.list(
      {
        ...query,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        sortBy: query.sortBy ?? 'createdAt',
        sortOrder: query.sortOrder ?? 'desc',
      },
      actor,
    );
  }

  async get(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await assignmentRepository.findAssignmentById(institutionId, id);
    if (!doc) throw new NotFoundError('Assignment not found');

    await this.assertAssignmentReadAccess(doc, actor, institutionId);
    return toDto(doc);
  }

  async update(id: string, input: UpdateAssignmentInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await assignmentRepository.findAssignmentById(institutionId, id);
    if (!existing) throw new NotFoundError('Assignment not found');
    await this.assertAssignmentWriteAccess(existing, actor, institutionId);

    const updates: Record<string, unknown> = { updatedBy: oid(actor.userId) };

    for (const key of [
      'title',
      'description',
      'instructions',
      'assignmentType',
      'visibility',
      'totalMarks',
      'passingMarks',
      'weightage',
      'allowLateSubmission',
      'latePenaltyPercent',
      'allowResubmission',
      'maxAttempts',
      'estimatedMinutes',
    ] as const) {
      if (input[key] !== undefined) updates[key] = input[key];
    }

    if (input.moduleId !== undefined) {
      updates.moduleId = input.moduleId ? oid(input.moduleId) : null;
    }
    if (input.lessonId !== undefined) {
      updates.lessonId = input.lessonId ? oid(input.lessonId) : null;
    }
    if (input.publishDate !== undefined) updates.publishDate = parseDate(input.publishDate);
    if (input.dueDate !== undefined) updates.dueDate = parseDate(input.dueDate);
    if (input.closeDate !== undefined) updates.closeDate = parseDate(input.closeDate);

    if (input.rubricId !== undefined) {
      if (input.rubricId) {
        const rubric = await assignmentRepository.findRubricById(institutionId, input.rubricId);
        if (!rubric) throw new NotFoundError('Rubric not found');
        updates.rubricId = oid(input.rubricId);
      } else {
        updates.rubricId = null;
      }
    }

    const totalMarks = (updates.totalMarks as number | undefined) ?? existing.totalMarks;
    const passingMarks = (updates.passingMarks as number | undefined) ?? existing.passingMarks;
    if (passingMarks > totalMarks) {
      throw new ValidationError('passingMarks cannot exceed totalMarks');
    }

    const doc = await assignmentRepository.updateAssignmentById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Assignment not found');

    await this.audit('assignment_updated', actor, institutionId, {
      assignmentId: id,
      courseId: String(doc.courseId),
    });

    eventBus.emit(EVENTS.ASSIGNMENT_UPDATED, {
      assignmentId: id,
      courseId: String(doc.courseId),
      institutionId,
    });

    return toDto(doc);
  }

  async remove(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await assignmentRepository.findAssignmentById(institutionId, id);
    if (!existing) throw new NotFoundError('Assignment not found');
    await this.assertAssignmentWriteAccess(existing, actor, institutionId);

    const doc = await assignmentRepository.softDeleteAssignment(institutionId, id);
    if (!doc) throw new NotFoundError('Assignment not found');

    await this.audit('assignment_deleted', actor, institutionId, {
      assignmentId: id,
      courseId: String(doc.courseId),
    });

    eventBus.emit(EVENTS.ASSIGNMENT_DELETED, {
      assignmentId: id,
      courseId: String(doc.courseId),
      institutionId,
    });

    return toDto(doc);
  }

  private async transition(id: string, to: AssignmentStatus, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await assignmentRepository.findAssignmentById(institutionId, id);
    if (!existing) throw new NotFoundError('Assignment not found');
    await this.assertAssignmentWriteAccess(existing, actor, institutionId);

    const from = existing.status;
    if (!canTransitionStatus(from, to)) {
      throw new ConflictError(`Cannot change assignment status from ${from} to ${to}`);
    }

    const updates: Record<string, unknown> = { status: to, updatedBy: oid(actor.userId) };
    if (to === 'published' && !existing.publishDate) {
      updates.publishDate = new Date();
    }

    const doc = await assignmentRepository.updateAssignmentById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Assignment not found');

    const auditEvent =
      to === 'published'
        ? 'assignment_published'
        : to === 'archived'
          ? 'assignment_archived'
          : to === 'closed'
            ? 'assignment_closed'
            : 'assignment_updated';

    await this.audit(auditEvent, actor, institutionId, {
      assignmentId: id,
      courseId: String(doc.courseId),
      metadata: { from, to },
    });

    if (to === 'published') {
      eventBus.emit(EVENTS.ASSIGNMENT_PUBLISHED, {
        assignmentId: id,
        courseId: String(doc.courseId),
        institutionId,
      });
    } else {
      eventBus.emit(EVENTS.ASSIGNMENT_UPDATED, {
        assignmentId: id,
        courseId: String(doc.courseId),
        institutionId,
      });
    }

    return toDto(doc);
  }

  async publish(id: string, actor: ActorContext) {
    return this.transition(id, 'published', actor);
  }

  async archive(id: string, actor: ActorContext) {
    return this.transition(id, 'archived', actor);
  }

  async close(id: string, actor: ActorContext) {
    return this.transition(id, 'closed', actor);
  }

  // ------------------------------------------------------------- files

  private async storeFile(
    input: AssignmentFileUploadInput,
    keyPrefix: string,
    actor: ActorContext,
  ): Promise<FileRef> {
    const buffer = Buffer.from(input.data, 'base64');
    if (buffer.length === 0) {
      throw new ValidationError('Uploaded file is empty');
    }
    if (buffer.length > ASSIGNMENT_MAX_FILE_BYTES) {
      const maxMb = Math.floor(ASSIGNMENT_MAX_FILE_BYTES / (1024 * 1024));
      throw new ValidationError(`File exceeds maximum size of ${String(maxMb)}MB`);
    }

    const id = newFileId();
    const key = `${keyPrefix}/${id}.${extensionFor(input.contentType)}`;
    const stored = await getStorage().put({
      key,
      body: buffer,
      contentType: input.contentType,
    });

    return {
      id,
      fileName: input.fileName,
      contentType: input.contentType,
      sizeBytes: buffer.length,
      storageKey: key,
      url: stored.url ?? null,
      uploadedBy: oid(actor.userId),
      createdAt: new Date(),
    };
  }

  async uploadAssignmentAttachment(
    id: string,
    input: AssignmentFileUploadInput,
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    const assignment = await assignmentRepository.findAssignmentById(institutionId, id);
    if (!assignment) throw new NotFoundError('Assignment not found');
    await this.assertAssignmentWriteAccess(assignment, actor, institutionId);

    const fileRef = await this.storeFile(
      input,
      `assignments/${institutionId}/${id}/attachments`,
      actor,
    );

    const doc = await assignmentRepository.pushAssignmentAttachment(
      institutionId,
      id,
      fileRef as unknown as Record<string, unknown>,
    );
    if (!doc) throw new NotFoundError('Assignment not found');

    await assignmentRepository.createAttachment({
      institutionId: oid(institutionId),
      assignmentId: oid(id),
      submissionId: null,
      commentId: null,
      fileRefId: fileRef.id,
      fileName: fileRef.fileName,
      contentType: fileRef.contentType,
      sizeBytes: fileRef.sizeBytes,
      storageKey: fileRef.storageKey,
      url: fileRef.url,
      uploadedBy: oid(actor.userId),
    });

    await this.audit('attachment_uploaded', actor, institutionId, {
      assignmentId: id,
      courseId: String(assignment.courseId),
      metadata: { fileName: fileRef.fileName, sizeBytes: fileRef.sizeBytes },
    });

    return toDto(doc);
  }

  async uploadSubmissionFile(
    submissionId: string,
    input: AssignmentFileUploadInput,
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    const submission = await assignmentRepository.findSubmissionById(institutionId, submissionId);
    if (!submission) throw new NotFoundError('Submission not found');

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      if (String(submission.studentId) !== String(student._id)) {
        throw new ForbiddenError('Can only attach files to your own submission');
      }
      if (submission.status === 'graded') {
        throw new ConflictError('Cannot modify a graded submission');
      }
    } else {
      const assignment = await assignmentRepository.findAssignmentById(
        institutionId,
        String(submission.assignmentId),
      );
      if (!assignment) throw new NotFoundError('Assignment not found');
      await this.assertAssignmentWriteAccess(assignment, actor, institutionId);
    }

    const fileRef = await this.storeFile(
      input,
      `assignments/${institutionId}/${String(submission.assignmentId)}/submissions/${submissionId}`,
      actor,
    );

    const doc = await assignmentRepository.pushSubmissionFile(
      institutionId,
      submissionId,
      fileRef as unknown as Record<string, unknown>,
    );
    if (!doc) throw new NotFoundError('Submission not found');

    await assignmentRepository.createAttachment({
      institutionId: oid(institutionId),
      assignmentId: submission.assignmentId,
      submissionId: submission._id,
      commentId: null,
      fileRefId: fileRef.id,
      fileName: fileRef.fileName,
      contentType: fileRef.contentType,
      sizeBytes: fileRef.sizeBytes,
      storageKey: fileRef.storageKey,
      url: fileRef.url,
      uploadedBy: oid(actor.userId),
    });

    await this.audit('attachment_uploaded', actor, institutionId, {
      assignmentId: String(submission.assignmentId),
      submissionId,
      courseId: String(submission.courseId),
      metadata: { fileName: fileRef.fileName, sizeBytes: fileRef.sizeBytes },
    });

    return toDto(doc);
  }

  // ------------------------------------------------------------- rubrics

  async listRubrics(
    query: { page?: number; limit?: number; q?: string },
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    const result = await assignmentRepository.listRubrics(institutionId, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async getRubric(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await assignmentRepository.findRubricById(institutionId, id);
    if (!doc) throw new NotFoundError('Rubric not found');
    return toDto(doc);
  }

  async createRubric(input: CreateRubricInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot create rubrics');
    }

    const criteria = input.criteria.map((c) => ({
      id: newFileId(),
      title: c.title,
      description: c.description ?? null,
      weight: c.weight,
      maxPoints: c.maxPoints,
    }));

    const doc = await assignmentRepository.createRubric({
      institutionId: oid(institutionId),
      title: input.title,
      description: input.description ?? null,
      criteria,
      totalPoints: rubricTotalPoints(criteria),
      reusable: input.reusable,
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    return toDto(doc);
  }

  async updateRubric(id: string, input: UpdateRubricInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await assignmentRepository.findRubricById(institutionId, id);
    if (!existing) throw new NotFoundError('Rubric not found');

    if (!canManage(actor) && String(existing.createdBy ?? '') !== actor.userId) {
      throw new ForbiddenError('Not allowed to modify this rubric');
    }

    const updates: Record<string, unknown> = { updatedBy: oid(actor.userId) };
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description ?? null;
    if (input.reusable !== undefined) updates.reusable = input.reusable;
    if (input.criteria !== undefined) {
      const criteria = input.criteria.map((c) => ({
        id: newFileId(),
        title: c.title,
        description: c.description ?? null,
        weight: c.weight,
        maxPoints: c.maxPoints,
      }));
      updates.criteria = criteria;
      updates.totalPoints = rubricTotalPoints(criteria);
    }

    const doc = await assignmentRepository.updateRubricById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Rubric not found');
    return toDto(doc);
  }

  async deleteRubric(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await assignmentRepository.findRubricById(institutionId, id);
    if (!existing) throw new NotFoundError('Rubric not found');

    if (!canManage(actor) && String(existing.createdBy ?? '') !== actor.userId) {
      throw new ForbiddenError('Not allowed to delete this rubric');
    }

    const doc = await assignmentRepository.softDeleteRubric(institutionId, id);
    if (!doc) throw new NotFoundError('Rubric not found');
    return toDto(doc);
  }

  // ------------------------------------------------------------- submissions

  async listSubmissions(query: SubmissionListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const filter = assignmentRepository.buildSubmissionFilter(institutionId, query);

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      filter.studentId = student._id;
    } else if (!canManage(actor)) {
      const courseIds = await this.facultyCourseIds(actor, institutionId);
      const assignments = await AssignmentModel.find({
        institutionId: oid(institutionId),
        deletedAt: null,
        $or: [{ createdBy: oid(actor.userId) }, { courseId: { $in: courseIds } }],
      })
        .select('_id')
        .exec();
      mergeAnd(filter, { assignmentId: { $in: assignments.map((a) => a._id) } });
    }

    const result = await assignmentRepository.listSubmissions(filter, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async getSubmission(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await assignmentRepository.findSubmissionById(institutionId, id);
    if (!doc) throw new NotFoundError('Submission not found');

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      if (String(doc.studentId) !== String(student._id)) {
        throw new ForbiddenError('Access denied');
      }
    } else if (!canManage(actor)) {
      const assignment = await assignmentRepository.findAssignmentById(
        institutionId,
        String(doc.assignmentId),
      );
      if (!assignment) throw new NotFoundError('Assignment not found');
      await this.assertAssignmentWriteAccess(assignment, actor, institutionId);
    }

    return toDto(doc);
  }

  async saveDraft(input: SaveSubmissionDraftInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can save submission drafts');
    }

    const student = await this.resolveStudent(actor, institutionId);
    const assignment = await assignmentRepository.findAssignmentById(
      institutionId,
      input.assignmentId,
    );
    if (!assignment) throw new NotFoundError('Assignment not found');
    if (assignment.status !== 'published') {
      throw new ForbiddenError('Assignment is not open for submissions');
    }
    await this.assertEnrollment(institutionId, student._id, assignment.courseId);

    const existing = await assignmentRepository.findDraftSubmission(
      input.assignmentId,
      String(student._id),
    );

    if (existing) {
      const doc = await assignmentRepository.updateSubmissionById(
        institutionId,
        String(existing._id),
        {
          submissionType: input.submissionType,
          textSubmission: input.textSubmission ?? null,
          links: input.links,
          timeSpentMinutes: input.timeSpentMinutes ?? null,
          updatedBy: oid(actor.userId),
        },
      );
      if (!doc) throw new NotFoundError('Submission not found');
      return toDto(doc);
    }

    const attempts = await assignmentRepository.countStudentAttempts(
      input.assignmentId,
      String(student._id),
    );

    const doc = await assignmentRepository.createSubmission({
      institutionId: oid(institutionId),
      assignmentId: assignment._id,
      courseId: assignment.courseId,
      studentId: student._id,
      attemptNumber: attempts + 1,
      submittedAt: null,
      status: 'draft',
      submissionType: input.submissionType,
      files: [],
      textSubmission: input.textSubmission ?? null,
      links: input.links,
      timeSpentMinutes: input.timeSpentMinutes ?? null,
      lateSubmission: false,
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    return toDto(doc);
  }

  async submit(input: SubmitAssignmentInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can submit assignments');
    }

    const student = await this.resolveStudent(actor, institutionId);
    const assignment = await assignmentRepository.findAssignmentById(
      institutionId,
      input.assignmentId,
    );
    if (!assignment) throw new NotFoundError('Assignment not found');
    await this.assertEnrollment(institutionId, student._id, assignment.courseId);

    const window = evaluateSubmissionWindow({
      status: assignment.status,
      dueDate: assignment.dueDate ?? null,
      closeDate: assignment.closeDate ?? null,
      allowLateSubmission: assignment.allowLateSubmission,
    });
    if (!window.allowed) {
      throw new ForbiddenError(window.reason ?? 'Submission not allowed');
    }

    const previousAttempts = await assignmentRepository.countStudentAttempts(
      input.assignmentId,
      String(student._id),
    );
    const attempt = evaluateAttempt({
      previousAttempts,
      maxAttempts: assignment.maxAttempts,
      allowResubmission: assignment.allowResubmission,
    });
    if (!attempt.allowed) {
      throw new ConflictError(attempt.reason ?? 'Submission not allowed');
    }

    const payload = {
      submissionType: input.submissionType,
      textSubmission: input.textSubmission ?? null,
      links: input.links,
      timeSpentMinutes: input.timeSpentMinutes ?? null,
      lateSubmission: window.late,
      status: resolveSubmissionStatus(window.late),
      submittedAt: new Date(),
      attemptNumber: attempt.nextAttempt,
      updatedBy: oid(actor.userId),
    };

    const draft = await assignmentRepository.findDraftSubmission(
      input.assignmentId,
      String(student._id),
    );

    const doc = draft
      ? await assignmentRepository.updateSubmissionById(institutionId, String(draft._id), payload)
      : await assignmentRepository.createSubmission({
          institutionId: oid(institutionId),
          assignmentId: assignment._id,
          courseId: assignment.courseId,
          studentId: student._id,
          files: [],
          createdBy: oid(actor.userId),
          ...payload,
        });

    if (!doc) throw new NotFoundError('Submission not found');

    await this.audit('submission_created', actor, institutionId, {
      assignmentId: input.assignmentId,
      submissionId: String(doc._id),
      courseId: String(assignment.courseId),
      studentId: String(student._id),
      metadata: { attemptNumber: attempt.nextAttempt, late: window.late },
    });

    eventBus.emit(EVENTS.SUBMISSION_CREATED, {
      submissionId: String(doc._id),
      assignmentId: input.assignmentId,
      studentId: String(student._id),
      institutionId,
    });

    return toDto(doc);
  }

  async gradeSubmission(
    submissionId: string,
    input: GradeSubmissionInput,
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot grade submissions');
    }

    const submission = await assignmentRepository.findSubmissionById(institutionId, submissionId);
    if (!submission) throw new NotFoundError('Submission not found');
    if (submission.status === 'draft') {
      throw new ConflictError('Cannot grade a draft submission');
    }

    const assignment = await assignmentRepository.findAssignmentById(
      institutionId,
      String(submission.assignmentId),
    );
    if (!assignment) throw new NotFoundError('Assignment not found');
    await this.assertAssignmentWriteAccess(assignment, actor, institutionId);

    const outcome = resolveGradeOutcome({
      gradingMethod: input.gradingMethod,
      marksObtained: input.marksObtained,
      percentage: input.percentage,
      passed: input.passed,
      rubricScores: input.rubricScores,
      totalMarks: assignment.totalMarks,
      passingMarks: assignment.passingMarks,
      late: submission.lateSubmission,
      latePenaltyPercent: assignment.latePenaltyPercent,
    });

    await assignmentRepository.softDeleteGradesForSubmission(submissionId);

    const grade = await assignmentRepository.createGrade({
      institutionId: oid(institutionId),
      assignmentId: submission.assignmentId,
      submissionId: submission._id,
      studentId: submission.studentId,
      gradingMethod: input.gradingMethod,
      marksObtained: outcome.marksObtained,
      percentage: outcome.percentage,
      passed: outcome.passed,
      feedback: input.feedback ?? null,
      rubricScores: input.rubricScores,
      gradedBy: oid(actor.userId),
      gradedAt: new Date(),
    });

    const doc = await assignmentRepository.updateSubmissionById(institutionId, submissionId, {
      gradeId: grade._id,
      status: input.returnToStudent ? 'returned' : 'graded',
      updatedBy: oid(actor.userId),
    });
    if (!doc) throw new NotFoundError('Submission not found');

    await this.audit('submission_graded', actor, institutionId, {
      assignmentId: String(submission.assignmentId),
      submissionId,
      courseId: String(submission.courseId),
      studentId: String(submission.studentId),
      metadata: {
        gradingMethod: input.gradingMethod,
        marksObtained: outcome.marksObtained,
        returned: input.returnToStudent,
      },
    });

    eventBus.emit(EVENTS.SUBMISSION_GRADED, {
      submissionId,
      assignmentId: String(submission.assignmentId),
      studentId: String(submission.studentId),
      institutionId,
      gradeId: String(grade._id),
    });

    return { submission: toDto(doc), grade: toDto(grade) };
  }

  // ------------------------------------------------------------- comments

  async listComments(assignmentId: string, submissionId: string | undefined, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const assignment = await assignmentRepository.findAssignmentById(institutionId, assignmentId);
    if (!assignment) throw new NotFoundError('Assignment not found');
    await this.assertAssignmentReadAccess(assignment, actor, institutionId);

    const comments = await assignmentRepository.listComments(
      institutionId,
      assignmentId,
      submissionId ?? null,
    );

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      const own = await AssignmentSubmissionModel.find({
        assignmentId: assignment._id,
        studentId: student._id,
        deletedAt: null,
      })
        .select('_id')
        .exec();
      const ownIds = new Set(own.map((s) => String(s._id)));

      return comments
        .filter((c) => !c.submissionId || ownIds.has(String(c.submissionId)))
        .map(toDto);
    }

    return comments.map(toDto);
  }

  async addComment(input: CreateCommentInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const assignment = await assignmentRepository.findAssignmentById(
      institutionId,
      input.assignmentId,
    );
    if (!assignment) throw new NotFoundError('Assignment not found');
    await this.assertAssignmentReadAccess(assignment, actor, institutionId);

    if (input.submissionId) {
      const submission = await assignmentRepository.findSubmissionById(
        institutionId,
        input.submissionId,
      );
      if (!submission) throw new NotFoundError('Submission not found');
      if (actor.role === 'student') {
        const student = await this.resolveStudent(actor, institutionId);
        if (String(submission.studentId) !== String(student._id)) {
          throw new ForbiddenError('Access denied');
        }
      }
    }

    if (input.parentCommentId) {
      const parent = await assignmentRepository.findCommentById(
        institutionId,
        input.parentCommentId,
      );
      if (!parent) throw new NotFoundError('Parent comment not found');
    }

    const doc = await assignmentRepository.createComment({
      institutionId: oid(institutionId),
      assignmentId: assignment._id,
      submissionId: input.submissionId ? oid(input.submissionId) : null,
      parentCommentId: input.parentCommentId ? oid(input.parentCommentId) : null,
      authorId: oid(actor.userId),
      authorRole: actor.role,
      body: input.body,
      attachments: [],
    });

    await this.audit('feedback_added', actor, institutionId, {
      assignmentId: input.assignmentId,
      submissionId: input.submissionId ?? null,
      courseId: String(assignment.courseId),
    });

    eventBus.emit(EVENTS.FEEDBACK_ADDED, {
      commentId: String(doc._id),
      assignmentId: input.assignmentId,
      submissionId: input.submissionId ?? null,
      institutionId,
    });

    return toDto(doc);
  }

  // ------------------------------------------------------------- import/export

  async import(input: AssignmentImportConfirmInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot import assignments');
    }

    const errors: { row: number; field?: string; message: string }[] = [];
    const assignmentIds: string[] = [];

    for (let i = 0; i < input.rows.length; i++) {
      const row = input.rows[i];
      const rowNumber = i + 1;
      if (!row) continue;

      try {
        await this.assertCourseWriteAccess(row.courseId, actor, institutionId);

        const course = await CourseModel.findOne({
          _id: row.courseId,
          institutionId: oid(institutionId),
          deletedAt: null,
        }).exec();
        if (!course) throw new NotFoundError(`Course not found: ${row.courseId}`);

        const totalMarks = row.totalMarks ?? 100;
        const passingMarks = row.passingMarks ?? 40;
        if (passingMarks > totalMarks) {
          throw new ValidationError('passingMarks cannot exceed totalMarks');
        }

        const doc = await assignmentRepository.createAssignment({
          institutionId: oid(institutionId),
          courseId: oid(row.courseId),
          moduleId: row.moduleId ? oid(row.moduleId) : null,
          lessonId: row.lessonId ? oid(row.lessonId) : null,
          title: row.title,
          description: row.description ?? null,
          assignmentType: row.assignmentType ?? 'homework',
          status: input.publish ? 'published' : 'draft',
          publishDate: input.publish ? new Date() : null,
          totalMarks,
          passingMarks,
          dueDate: parseDate(row.dueDate),
          createdBy: oid(actor.userId),
          updatedBy: oid(actor.userId),
        });

        assignmentIds.push(String(doc._id));

        await this.audit('assignment_created', actor, institutionId, {
          assignmentId: String(doc._id),
          courseId: row.courseId,
          metadata: { source: 'import' },
        });

        eventBus.emit(EVENTS.ASSIGNMENT_CREATED, {
          assignmentId: String(doc._id),
          courseId: row.courseId,
          institutionId,
        });
      } catch (error) {
        logger.warn({ error, row: rowNumber }, 'Assignment import row failed');
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      imported: assignmentIds.length,
      failed: errors.length,
      errors,
      assignmentIds,
    };
  }

  async export(query: AssignmentExportQuery, actor: ActorContext) {
    requireTenant(actor);

    const listQuery = {
      courseId: query.courseId,
      status: query.status,
      page: 1,
      limit: 10000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    } as AssignmentListQuery;

    const result = await this.list(listQuery, actor);
    const rows = result.items.map((item) =>
      Object.fromEntries(ASSIGNMENT_CSV_HEADERS.map((h) => [h, item[h]])),
    );

    if (query.format === 'csv') {
      return { data: rowsToCsv(rows), format: 'csv' as const, count: rows.length };
    }

    return { data: result.items, format: 'json' as const, count: result.items.length };
  }

  // ------------------------------------------------------------- dashboards

  /** Expected submissions = Σ (published assignments per course × active enrollments). */
  private async expectedSubmissions(
    institutionId: string,
    extraMatch: Record<string, unknown> = {},
  ): Promise<number> {
    const institutionOid = oid(institutionId);

    const byCourse = await AssignmentModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      {
        $match: {
          institutionId: institutionOid,
          deletedAt: null,
          status: { $in: ['published', 'closed'] },
          ...extraMatch,
        },
      },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]);

    if (byCourse.length === 0) return 0;

    const enrollments = await EnrollmentModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          institutionId: institutionOid,
          deletedAt: null,
          courseId: { $in: byCourse.map((r) => r._id) },
          status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
        },
      },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]);

    const enrolledByCourse = new Map(enrollments.map((r) => [String(r._id), r.count]));
    return byCourse.reduce(
      (sum, row) => sum + row.count * (enrolledByCourse.get(String(row._id)) ?? 0),
      0,
    );
  }

  async getFacultyDashboard(actor: ActorContext): Promise<AssignmentFacultyDashboard> {
    const institutionId = requireTenant(actor);
    const institutionOid = oid(institutionId);
    const courseIds = await this.facultyCourseIds(actor, institutionId);

    const ownership = {
      $or: [{ createdBy: oid(actor.userId) }, { courseId: { $in: courseIds } }],
    };

    const assignments = await AssignmentModel.find({
      institutionId: institutionOid,
      deletedAt: null,
      ...ownership,
    })
      .select('_id')
      .exec();
    const assignmentIds = assignments.map((a) => a._id);

    const submissionBase = {
      institutionId: institutionOid,
      deletedAt: null,
      assignmentId: { $in: assignmentIds },
    };

    const [assignmentsCreated, pendingReviews, lateSubmissions, totalSubmissions, averageGrade] =
      await Promise.all([
        AssignmentModel.countDocuments({
          institutionId: institutionOid,
          deletedAt: null,
          createdBy: oid(actor.userId),
        }),
        assignmentRepository.countSubmissions({
          ...submissionBase,
          status: { $in: ['submitted', 'late'] },
          gradeId: null,
        }),
        assignmentRepository.countSubmissions({ ...submissionBase, lateSubmission: true }),
        assignmentRepository.countSubmissions({
          ...submissionBase,
          status: { $ne: 'draft' },
        }),
        assignmentRepository.averageGrade({
          institutionId: institutionOid,
          assignmentId: { $in: assignmentIds },
        }),
      ]);

    const expected = await this.expectedSubmissions(institutionId, {
      _id: { $in: assignmentIds },
    });

    return {
      assignmentsCreated,
      pendingReviews,
      lateSubmissions,
      averageGrade,
      submissionRate: computeSubmissionRate(totalSubmissions, expected),
    };
  }

  async getStudentDashboard(actor: ActorContext): Promise<AssignmentStudentDashboard> {
    const institutionId = requireTenant(actor);
    const institutionOid = oid(institutionId);
    const student = await this.resolveStudent(actor, institutionId);
    const courseIds = await this.enrolledCourseIds(student._id, institutionId);
    const now = new Date();

    const [openAssignments, submissions, late, gradesReceived] = await Promise.all([
      AssignmentModel.find({
        institutionId: institutionOid,
        deletedAt: null,
        status: 'published',
        courseId: { $in: courseIds },
      })
        .select('_id dueDate')
        .exec(),
      AssignmentSubmissionModel.find({
        institutionId: institutionOid,
        deletedAt: null,
        studentId: student._id,
        status: { $ne: 'draft' },
      })
        .select('assignmentId')
        .exec(),
      assignmentRepository.countSubmissions({
        institutionId: institutionOid,
        deletedAt: null,
        studentId: student._id,
        lateSubmission: true,
      }),
      AssignmentGradeModel.countDocuments({
        institutionId: institutionOid,
        deletedAt: null,
        studentId: student._id,
      }).exec(),
    ]);

    const submittedIds = new Set(submissions.map((s) => String(s.assignmentId)));
    const outstanding = openAssignments.filter((a) => !submittedIds.has(String(a._id)));

    return {
      upcoming: outstanding.filter((a) => !a.dueDate || a.dueDate.getTime() >= now.getTime())
        .length,
      submitted: submissions.length,
      pending: outstanding.length,
      late,
      gradesReceived,
    };
  }

  async getInstitutionDashboard(actor: ActorContext): Promise<AssignmentInstitutionDashboard> {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) {
      throw new ForbiddenError('Institution dashboard requires admin access');
    }

    const stats = await assignmentRepository.getStats(institutionId);
    const expected = await this.expectedSubmissions(institutionId);

    return {
      totalAssignments: stats.total,
      published: stats.published,
      closed: stats.closed,
      totalSubmissions: stats.totalSubmissions,
      gradedSubmissions: stats.gradedSubmissions,
      lateSubmissions: stats.lateSubmissions,
      submissionRate: computeSubmissionRate(stats.totalSubmissions, expected),
      averageGrade: stats.averageGrade,
      byDepartment: stats.byDepartment,
      byCourse: stats.byCourse,
    };
  }

  async getStats(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) {
      throw new ForbiddenError('Assignment stats require admin access');
    }
    return assignmentRepository.getStats(institutionId);
  }

  // ------------------------------------------------------------- student self

  async getOwnAssignments(query: AssignmentListQuery, actor: ActorContext) {
    requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can list their own assignments');
    }
    return this.list({ ...query, status: 'published' }, actor);
  }

  async listAudit(assignmentId: string | undefined, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) {
      throw new ForbiddenError('Audit log requires admin access');
    }

    const logs = await assignmentRepository.listAudit(institutionId, assignmentId);
    return logs.map((log) => ({
      id: String(log._id),
      event: log.event,
      institutionId: String(log.institutionId),
      assignmentId: log.assignmentId ? String(log.assignmentId) : null,
      submissionId: log.submissionId ? String(log.submissionId) : null,
      courseId: log.courseId ? String(log.courseId) : null,
      studentId: log.studentId ? String(log.studentId) : null,
      userId: log.userId ? String(log.userId) : null,
      email: log.email,
      metadata: (log.metadata ?? {}) as Record<string, unknown>,
      createdAt: log.createdAt.toISOString(),
    }));
  }
}

export const assignmentService = new AssignmentService();
