import { Types } from 'mongoose';
import type { z } from 'zod';
import { EVENTS } from '@learnova/events';
import type {
  CreateMilestoneInput,
  CreateProjectInput,
  CreateReviewInput,
  CreateTeamInput,
  GradeProjectSubmissionInput,
  JoinTeamInput,
  ProjectFileUploadInput,
  ProjectListQuery,
  SaveProjectSubmissionDraftInput,
  SubmitProjectInput,
  SubmitReviewInput,
  UpdateMilestoneInput,
  UpdateProjectInput,
  UpdateTeamInput,
} from '@learnova/validation';
import {
  PROJECT_MAX_FILE_BYTES,
  type projectExportQuerySchema,
  type projectImportConfirmSchema,
} from '@learnova/validation';
import type {
  ProjectFacultyDashboard,
  ProjectInstitutionDashboard,
  ProjectStatus,
  ProjectStudentDashboard,
} from '@learnova/types';
import { eventBus } from '../../events/index.js';
import { ProjectModel } from '../../models/project.model.js';
import { ProjectMilestoneModel } from '../../models/project-milestone.model.js';
import { ProjectSubmissionModel } from '../../models/project-submission.model.js';
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
import { projectRepository } from '../../repositories/project/index.js';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  PROJECT_CSV_HEADERS,
  canTransitionStatus,
  computeSubmissionRate,
  DEFAULT_PROJECT_MILESTONES,
  ensureUniqueProjectSlug,
  evaluateAttempt,
  evaluateSubmissionWindow,
  extensionFor,
  generateSlug,
  pageMeta,
  parseDate,
  resolveGradeOutcome,
  resolveSubmissionStatus,
  rowsToCsv,
} from './project.helpers.js';
import type { ProjectSubmissionListQuery, ProjectTeamListQuery } from '@learnova/validation';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

export type ProjectExportQuery = z.infer<typeof projectExportQuerySchema>;
export type ProjectImportConfirmInput = z.infer<typeof projectImportConfirmSchema>;

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

export class ProjectService {
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

  private async assertProjectWriteAccess(
    project: { createdBy?: Types.ObjectId | null; courseId: Types.ObjectId },
    actor: ActorContext,
    institutionId: string,
  ): Promise<void> {
    if (canManage(actor)) return;
    if (actor.role !== 'faculty') {
      throw new ForbiddenError('Not allowed to modify this project');
    }
    if (project.createdBy && String(project.createdBy) === actor.userId) return;

    const courseIds = await this.facultyCourseIds(actor, institutionId);
    if (courseIds.some((c) => String(c) === String(project.courseId))) return;

    throw new ForbiddenError('Not allowed to modify this project');
  }

  private async assertCourseWriteAccess(
    courseId: string,
    actor: ActorContext,
    institutionId: string,
  ): Promise<void> {
    if (canManage(actor)) return;
    if (actor.role !== 'faculty') {
      throw new ForbiddenError('Not allowed to create projects for this course');
    }
    const courseIds = await this.facultyCourseIds(actor, institutionId);
    if (!courseIds.some((c) => String(c) === courseId)) {
      throw new ForbiddenError('Not allowed to create projects for this course');
    }
  }

  private async scopeProjectFilter(
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
      mergeAnd(filter, { courseId: { $in: courseIds }, status: { $in: ['published', 'open'] } });
      return filter;
    }

    mergeAnd(filter, { status: { $in: ['published', 'open'] } });
    return filter;
  }

  private async assertProjectReadAccess(
    project: { createdBy?: Types.ObjectId | null; courseId: Types.ObjectId; status: string },
    actor: ActorContext,
    institutionId: string,
  ): Promise<void> {
    if (canManage(actor)) return;

    if (actor.role === 'faculty') {
      if (project.createdBy && String(project.createdBy) === actor.userId) return;
      const courseIds = await this.facultyCourseIds(actor, institutionId);
      const ownsCourse = courseIds.some((c) => String(c) === String(project.courseId));
      if (ownsCourse && project.status !== 'draft') return;
      throw new ForbiddenError('Access denied');
    }

    if (actor.role === 'student') {
      if (project.status !== 'published' && project.status !== 'open') {
        throw new ForbiddenError('Project is not available');
      }
      const student = await this.resolveStudent(actor, institutionId);
      await this.assertEnrollment(institutionId, student._id, project.courseId);
      return;
    }

    if (project.status !== 'published' && project.status !== 'open') {
      throw new ForbiddenError('Access denied');
    }
  }

  private async audit(
    event: Parameters<typeof projectRepository.logAudit>[0]['event'],
    actor: ActorContext,
    institutionId: string,
    payload: {
      projectId?: string | null;
      submissionId?: string | null;
      teamId?: string | null;
      milestoneId?: string | null;
      courseId?: string | null;
      studentId?: string | null;
      metadata?: Record<string, unknown>;
    } = {},
  ) {
    await projectRepository.logAudit({
      event,
      institutionId,
      projectId: payload.projectId ?? null,
      submissionId: payload.submissionId ?? null,
      teamId: payload.teamId ?? null,
      milestoneId: payload.milestoneId ?? null,
      courseId: payload.courseId ?? null,
      studentId: payload.studentId ?? null,
      userId: actor.userId,
      email: actor.email,
      metadata: payload.metadata,
    });
  }

  private async storeFile(
    input: ProjectFileUploadInput,
    keyPrefix: string,
    actor: ActorContext,
  ): Promise<FileRef> {
    const buffer = Buffer.from(input.data, 'base64');
    if (buffer.length === 0) {
      throw new ValidationError('Uploaded file is empty');
    }
    if (buffer.length > PROJECT_MAX_FILE_BYTES) {
      const maxMb = Math.floor(PROJECT_MAX_FILE_BYTES / (1024 * 1024));
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

  private submissionPayload(input: SaveProjectSubmissionDraftInput | SubmitProjectInput) {
    return {
      deliveryType: input.deliveryType,
      submissionText: input.submissionText ?? null,
      githubRepository: input.githubRepository ?? null,
      demoVideo: input.demoVideo ?? null,
      liveDemoURL: input.liveDemoURL ?? null,
      links: input.links,
      timeSpentMinutes: input.timeSpentMinutes ?? null,
    };
  }

  private async resolveSubmissionContext(
    project: {
      _id: Types.ObjectId;
      courseId: Types.ObjectId;
      projectType: string;
      allowTeams?: boolean;
      allowIndividual?: boolean;
      maxAttempts: number;
      allowResubmission: boolean;
      status: string;
      dueDate?: Date | null;
      closeDate?: Date | null;
      allowLateSubmission?: boolean;
      lateSubmissionAllowed?: boolean;
    },
    actor: ActorContext,
    institutionId: string,
  ) {
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can submit project work');
    }

    const student = await this.resolveStudent(actor, institutionId);
    await this.assertEnrollment(institutionId, student._id, project.courseId);

    let teamId: Types.ObjectId | null = null;
    if (project.allowTeams !== false && project.projectType !== 'individual') {
      const team = await projectRepository.findTeamByMember(
        institutionId,
        String(project._id),
        String(student._id),
      );
      if (!project.allowIndividual && !team) {
        throw new ForbiddenError('You must join a team before submitting');
      }
      teamId = team?._id ?? null;
    }

    return { student, teamId };
  }

  // ------------------------------------------------------------------ projects

  async create(input: CreateProjectInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    await this.assertCourseWriteAccess(input.courseId, actor, institutionId);

    const course = await CourseModel.findOne({
      _id: input.courseId,
      institutionId: oid(institutionId),
      deletedAt: null,
    }).exec();
    if (!course) throw new NotFoundError('Course not found');

    const totalMarks = input.totalMarks;
    const passingMarks = input.passingMarks;
    if (passingMarks > totalMarks) {
      throw new ValidationError('passingMarks cannot exceed totalMarks');
    }

    const teamSizeMin = input.minimumTeamSize;
    const teamSizeMax = input.maximumTeamSize;
    if (teamSizeMin > teamSizeMax) {
      throw new ValidationError('minimumTeamSize cannot exceed maximumTeamSize');
    }

    const baseSlug = input.slug ?? generateSlug(input.title);
    const slug = await ensureUniqueProjectSlug(institutionId, baseSlug, (candidate) =>
      projectRepository.slugExists(institutionId, candidate),
    );

    const doc = await projectRepository.createProject({
      institutionId: oid(institutionId),
      courseId: oid(input.courseId),
      moduleId: input.moduleId ? oid(input.moduleId) : null,
      lessonId: input.lessonId ? oid(input.lessonId) : null,
      slug,
      title: input.title,
      description: input.description ?? null,
      instructions: input.instructions ?? null,
      objective: input.objective ?? null,
      problemStatement: input.problemStatement ?? null,
      learningOutcomes: input.learningOutcomes,
      difficulty: input.difficulty,
      categoryId: input.categoryId ? oid(input.categoryId) : null,
      tags: input.tags.map((id) => oid(id)),
      projectType: input.projectType,
      allowIndividual: input.allowIndividual,
      allowTeams: input.allowTeams,
      minimumTeamSize: teamSizeMin,
      maximumTeamSize: teamSizeMax,
      allowSelfTeamFormation: input.allowSelfTeamFormation,
      allowPeerReview: input.allowPeerReview,
      peerReviewsRequired: input.peerReviewsRequired,
      allowRepoLink: input.allowRepoLink,
      allowMilestones: input.allowMilestones,
      visibility: input.visibility,
      status: 'draft',
      totalMarks,
      passingMarks,
      weightage: input.weightage,
      startDate: parseDate(input.startDate),
      dueDate: parseDate(input.dueDate),
      submissionDeadline: parseDate(input.submissionDeadline),
      lateSubmissionAllowed: input.lateSubmissionAllowed,
      latePenalty: input.latePenalty,
      allowResubmission: input.allowResubmission,
      maxAttempts: input.maxAttempts,
      publishDate: parseDate(input.publishDate),
      closeDate: parseDate(input.closeDate),
      estimatedHours: input.estimatedHours ?? null,
      resources: input.resources,
      assignedFacultyIds: input.assignedFacultyIds.map((id) => oid(id)),
      attachments: [],
      rubricId: input.rubricId ? oid(input.rubricId) : null,
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    if (input.allowMilestones) {
      await projectRepository.createMilestonesBulk(
        DEFAULT_PROJECT_MILESTONES.map((m) => ({
          institutionId: oid(institutionId),
          projectId: doc._id,
          title: m.title,
          description: m.description,
          milestoneType: m.milestoneType,
          order: m.order,
          weightage: m.weightage,
          status: 'pending',
          createdBy: oid(actor.userId),
          updatedBy: oid(actor.userId),
        })),
      );
    }

    await this.audit('project_created', actor, institutionId, {
      projectId: String(doc._id),
      courseId: input.courseId,
    });

    eventBus.emit(EVENTS.PROJECT_CREATED, {
      projectId: String(doc._id),
      courseId: input.courseId,
      institutionId,
    });

    return toDto(doc);
  }

  async list(query: ProjectListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let filter = projectRepository.buildProjectFilter(institutionId, query);
    filter = await this.scopeProjectFilter(filter, actor, institutionId);

    const result = await projectRepository.listProjects(filter, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async search(query: Partial<ProjectListQuery>, actor: ActorContext) {
    return this.list(
      {
        ...query,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        sortBy: query.sortBy ?? 'createdAt',
        sortOrder: query.sortOrder ?? 'desc',
      } as ProjectListQuery,
      actor,
    );
  }

  async get(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await projectRepository.findProjectById(institutionId, id);
    if (!doc) throw new NotFoundError('Project not found');

    await this.assertProjectReadAccess(doc, actor, institutionId);
    return toDto(doc);
  }

  async update(id: string, input: UpdateProjectInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await projectRepository.findProjectById(institutionId, id);
    if (!existing) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(existing, actor, institutionId);

    const updates: Record<string, unknown> = { updatedBy: oid(actor.userId) };

    const scalarFields = [
      'title',
      'description',
      'instructions',
      'objective',
      'problemStatement',
      'projectType',
      'difficulty',
      'allowIndividual',
      'allowTeams',
      'minimumTeamSize',
      'maximumTeamSize',
      'allowSelfTeamFormation',
      'allowPeerReview',
      'peerReviewsRequired',
      'allowRepoLink',
      'allowMilestones',
      'visibility',
      'totalMarks',
      'passingMarks',
      'weightage',
      'lateSubmissionAllowed',
      'latePenalty',
      'allowResubmission',
      'maxAttempts',
      'estimatedHours',
    ] as const;

    for (const key of scalarFields) {
      if (input[key] !== undefined) updates[key] = input[key];
    }

    if (input.moduleId !== undefined) {
      updates.moduleId = input.moduleId ? oid(input.moduleId) : null;
    }
    if (input.lessonId !== undefined) {
      updates.lessonId = input.lessonId ? oid(input.lessonId) : null;
    }
    if (input.categoryId !== undefined) {
      updates.categoryId = input.categoryId ? oid(input.categoryId) : null;
    }
    if (input.tags !== undefined) {
      updates.tags = input.tags.map((tagId) => oid(tagId));
    }
    if (input.learningOutcomes !== undefined) {
      updates.learningOutcomes = input.learningOutcomes;
    }
    if (input.resources !== undefined) {
      updates.resources = input.resources;
    }
    if (input.assignedFacultyIds !== undefined) {
      updates.assignedFacultyIds = input.assignedFacultyIds.map((facultyId) => oid(facultyId));
    }
    if (input.startDate !== undefined) updates.startDate = parseDate(input.startDate);
    if (input.submissionDeadline !== undefined) {
      updates.submissionDeadline = parseDate(input.submissionDeadline);
    }
    if (input.publishDate !== undefined) updates.publishDate = parseDate(input.publishDate);
    if (input.dueDate !== undefined) updates.dueDate = parseDate(input.dueDate);
    if (input.closeDate !== undefined) updates.closeDate = parseDate(input.closeDate);
    if (input.rubricId !== undefined) {
      updates.rubricId = input.rubricId ? oid(input.rubricId) : null;
    }

    const totalMarks = (updates.totalMarks as number | undefined) ?? existing.totalMarks;
    const passingMarks = (updates.passingMarks as number | undefined) ?? existing.passingMarks;
    if (passingMarks > totalMarks) {
      throw new ValidationError('passingMarks cannot exceed totalMarks');
    }

    const doc = await projectRepository.updateProjectById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Project not found');

    await this.audit('project_updated', actor, institutionId, {
      projectId: id,
      courseId: String(doc.courseId),
    });

    eventBus.emit(EVENTS.PROJECT_UPDATED, {
      projectId: id,
      courseId: String(doc.courseId),
      institutionId,
    });

    return toDto(doc);
  }

  async remove(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await projectRepository.findProjectById(institutionId, id);
    if (!existing) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(existing, actor, institutionId);

    const doc = await projectRepository.softDeleteProject(institutionId, id);
    if (!doc) throw new NotFoundError('Project not found');

    await this.audit('project_deleted', actor, institutionId, {
      projectId: id,
      courseId: String(doc.courseId),
    });

    return toDto(doc);
  }

  private async transition(id: string, to: ProjectStatus, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await projectRepository.findProjectById(institutionId, id);
    if (!existing) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(existing, actor, institutionId);

    const from = existing.status;
    if (!canTransitionStatus(from, to)) {
      throw new ConflictError(`Cannot change project status from ${from} to ${to}`);
    }

    const updates: Record<string, unknown> = { status: to, updatedBy: oid(actor.userId) };
    if (to === 'published' && !existing.publishDate) {
      updates.publishDate = new Date();
    }

    const doc = await projectRepository.updateProjectById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Project not found');

    const auditEvent =
      to === 'published'
        ? 'project_published'
        : to === 'archived'
          ? 'project_archived'
          : to === 'closed'
            ? 'project_closed'
            : 'project_updated';

    await this.audit(auditEvent, actor, institutionId, {
      projectId: id,
      courseId: String(doc.courseId),
      metadata: { from, to },
    });

    if (to === 'published') {
      eventBus.emit(EVENTS.PROJECT_PUBLISHED, {
        projectId: id,
        courseId: String(doc.courseId),
        institutionId,
      });
    } else if (to === 'archived') {
      eventBus.emit(EVENTS.PROJECT_ARCHIVED, {
        projectId: id,
        courseId: String(doc.courseId),
        institutionId,
      });
    } else {
      eventBus.emit(EVENTS.PROJECT_UPDATED, {
        projectId: id,
        courseId: String(doc.courseId),
        institutionId,
      });
    }

    return toDto(doc);
  }

  async publish(id: string, actor: ActorContext) {
    return this.transition(id, 'published', actor);
  }

  async open(id: string, actor: ActorContext) {
    return this.transition(id, 'open', actor);
  }

  async archive(id: string, actor: ActorContext) {
    return this.transition(id, 'archived', actor);
  }

  async close(id: string, actor: ActorContext) {
    return this.transition(id, 'closed', actor);
  }

  async duplicate(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await projectRepository.findProjectById(institutionId, id);
    if (!existing) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(existing, actor, institutionId);

    const baseSlug = await ensureUniqueProjectSlug(
      institutionId,
      generateSlug(`${existing.title}-copy`),
      (candidate) => projectRepository.slugExists(institutionId, candidate),
    );

    const doc = await projectRepository.createProject({
      institutionId: existing.institutionId,
      courseId: existing.courseId,
      moduleId: existing.moduleId,
      lessonId: existing.lessonId,
      slug: baseSlug,
      title: `${existing.title} (Copy)`,
      description: existing.description,
      instructions: existing.instructions,
      objective: existing.objective,
      projectType: existing.projectType,
      minimumTeamSize: existing.minimumTeamSize,
      maximumTeamSize: existing.maximumTeamSize,
      allowSelfTeamFormation: existing.allowSelfTeamFormation,
      allowPeerReview: existing.allowPeerReview,
      peerReviewsRequired: existing.peerReviewsRequired,
      allowRepoLink: existing.allowRepoLink,
      allowMilestones: existing.allowMilestones,
      visibility: existing.visibility,
      status: 'draft',
      totalMarks: existing.totalMarks,
      passingMarks: existing.passingMarks,
      weightage: existing.weightage,
      lateSubmissionAllowed: existing.lateSubmissionAllowed,
      latePenalty: existing.latePenalty,
      allowResubmission: existing.allowResubmission,
      maxAttempts: existing.maxAttempts,
      publishDate: null,
      dueDate: existing.dueDate,
      closeDate: existing.closeDate,
      estimatedHours: existing.estimatedHours,
      attachments: [],
      tags: existing.tags ?? [],
      assignedFacultyIds: existing.assignedFacultyIds ?? [],
      resources: [],
      rubricId: existing.rubricId,
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
      deletedAt: null,
    });

    await this.audit('project_created', actor, institutionId, {
      projectId: String(doc._id),
      courseId: String(doc.courseId),
      metadata: { duplicatedFrom: id },
    });

    eventBus.emit(EVENTS.PROJECT_CREATED, {
      projectId: String(doc._id),
      courseId: String(doc.courseId),
      institutionId,
    });

    return toDto(doc);
  }

  async uploadProjectAttachment(id: string, input: ProjectFileUploadInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const project = await projectRepository.findProjectById(institutionId, id);
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(project, actor, institutionId);

    const fileRef = await this.storeFile(
      input,
      `projects/${institutionId}/${id}/attachments`,
      actor,
    );

    const doc = await projectRepository.pushProjectAttachment(
      institutionId,
      id,
      fileRef as unknown as Record<string, unknown>,
    );
    if (!doc) throw new NotFoundError('Project not found');

    await this.audit('attachment_uploaded', actor, institutionId, {
      projectId: id,
      courseId: String(project.courseId),
      metadata: { fileName: fileRef.fileName, sizeBytes: fileRef.sizeBytes },
    });

    return toDto(doc);
  }

  // --------------------------------------------------------------- milestones

  async listMilestones(projectId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const project = await projectRepository.findProjectById(institutionId, projectId);
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectReadAccess(project, actor, institutionId);

    const result = await projectRepository.listMilestones(institutionId, projectId);
    return { items: result.items.map(toDto), total: result.total };
  }

  async createMilestone(input: CreateMilestoneInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const project = await projectRepository.findProjectById(institutionId, input.projectId);
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(project, actor, institutionId);

    const order =
      input.order ??
      (await projectRepository.countMilestones(input.projectId));

    const doc = await projectRepository.createMilestone({
      institutionId: oid(institutionId),
      projectId: oid(input.projectId),
      title: input.title,
      description: input.description ?? null,
      dueDate: parseDate(input.dueDate),
      order,
      weightage: input.weightage,
      milestoneType: input.milestoneType,
      status: 'pending',
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    await this.audit('milestone_created', actor, institutionId, {
      projectId: input.projectId,
      milestoneId: String(doc._id),
      courseId: String(project.courseId),
    });

    return toDto(doc);
  }

  async updateMilestone(id: string, input: UpdateMilestoneInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await projectRepository.findMilestoneById(institutionId, id);
    if (!existing) throw new NotFoundError('Milestone not found');

    const project = await projectRepository.findProjectById(
      institutionId,
      String(existing.projectId),
    );
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(project, actor, institutionId);

    const updates: Record<string, unknown> = { updatedBy: oid(actor.userId) };
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description ?? null;
    if (input.dueDate !== undefined) updates.dueDate = parseDate(input.dueDate);
    if (input.order !== undefined) updates.order = input.order;
    if (input.weightage !== undefined) updates.weightage = input.weightage;
    if (input.milestoneType !== undefined) updates.milestoneType = input.milestoneType;

    const doc = await projectRepository.updateMilestoneById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Milestone not found');

    await this.audit('milestone_updated', actor, institutionId, {
      projectId: String(doc.projectId),
      milestoneId: id,
      courseId: String(project.courseId),
    });

    return toDto(doc);
  }

  async deleteMilestone(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await projectRepository.findMilestoneById(institutionId, id);
    if (!existing) throw new NotFoundError('Milestone not found');

    const project = await projectRepository.findProjectById(
      institutionId,
      String(existing.projectId),
    );
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(project, actor, institutionId);

    const doc = await projectRepository.softDeleteMilestone(institutionId, id);
    if (!doc) throw new NotFoundError('Milestone not found');
    return toDto(doc);
  }

  async completeMilestone(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await projectRepository.findMilestoneById(institutionId, id);
    if (!existing) throw new NotFoundError('Milestone not found');

    const project = await projectRepository.findProjectById(
      institutionId,
      String(existing.projectId),
    );
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(project, actor, institutionId);

    const doc = await projectRepository.updateMilestoneById(institutionId, id, {
      status: 'completed',
      updatedBy: oid(actor.userId),
    });
    if (!doc) throw new NotFoundError('Milestone not found');

    await this.audit('milestone_completed', actor, institutionId, {
      projectId: String(doc.projectId),
      milestoneId: id,
      courseId: String(project.courseId),
    });

    eventBus.emit(EVENTS.PROJECT_MILESTONE_COMPLETED, {
      projectId: String(doc.projectId),
      milestoneId: id,
      institutionId,
    });

    return toDto(doc);
  }

  // --------------------------------------------------------------------- teams

  async listTeams(query: ProjectTeamListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const filter = projectRepository.buildTeamFilter(institutionId, query);

    if (query.projectId) {
      const project = await projectRepository.findProjectById(institutionId, query.projectId);
      if (!project) throw new NotFoundError('Project not found');
      await this.assertProjectReadAccess(project, actor, institutionId);
    }

    const result = await projectRepository.listTeams(filter, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async createTeam(input: CreateTeamInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can create teams');
    }

    const project = await projectRepository.findProjectById(institutionId, input.projectId);
    if (!project) throw new NotFoundError('Project not found');
    if (project.status !== 'published' && project.status !== 'open') {
      throw new ForbiddenError('Project is not open for team formation');
    }
    if (!project.allowSelfTeamFormation) {
      throw new ForbiddenError('Self team formation is not allowed');
    }
    if (!project.allowTeams) {
      throw new ForbiddenError('This project does not allow teams');
    }

    const student = await this.resolveStudent(actor, institutionId);
    await this.assertEnrollment(institutionId, student._id, project.courseId);

    const existingTeam = await projectRepository.findTeamByMember(
      institutionId,
      input.projectId,
      String(student._id),
    );
    if (existingTeam) {
      throw new ConflictError('You are already on a team for this project');
    }

    const teamName = input.teamName;
    const teamStatus = project.allowSelfTeamFormation ? 'approved' : 'pending';

    const doc = await projectRepository.createTeam({
      institutionId: oid(institutionId),
      projectId: oid(input.projectId),
      courseId: project.courseId,
      teamName,
      status: teamStatus,
      leaderId: student._id,
      memberCount: 1,
      repoLink: input.repoLink ?? null,
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    await projectRepository.createMember({
      institutionId: oid(institutionId),
      teamId: doc._id,
      projectId: oid(input.projectId),
      studentId: student._id,
      role: 'leader',
      invitationStatus: 'accepted',
      joinedAt: new Date(),
      approvedBy: teamStatus === 'approved' ? oid(actor.userId) : null,
    });

    await this.audit('team_created', actor, institutionId, {
      projectId: input.projectId,
      teamId: String(doc._id),
      courseId: String(project.courseId),
      studentId: String(student._id),
      metadata: { status: teamStatus },
    });

    eventBus.emit(EVENTS.PROJECT_TEAM_CREATED, {
      projectId: input.projectId,
      teamId: String(doc._id),
      institutionId,
    });

    return toDto(doc);
  }

  async joinTeam(input: JoinTeamInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can join teams');
    }

    const team = await projectRepository.findTeamById(institutionId, input.teamId);
    if (!team) throw new NotFoundError('Team not found');
    if (team.status === 'rejected') {
      throw new ConflictError('Team has been rejected');
    }
    if (team.status === 'pending') {
      throw new ConflictError('Team is pending faculty approval');
    }

    const project = await projectRepository.findProjectById(
      institutionId,
      String(team.projectId),
    );
    if (!project) throw new NotFoundError('Project not found');
    if (project.status !== 'published' && project.status !== 'open') {
      throw new ForbiddenError('Project is not open for team formation');
    }

    const student = await this.resolveStudent(actor, institutionId);
    await this.assertEnrollment(institutionId, student._id, project.courseId);

    const alreadyMember = await projectRepository.findMemberByTeamAndStudent(
      institutionId,
      input.teamId,
      String(student._id),
    );
    if (alreadyMember) {
      throw new ConflictError('You are already on this team');
    }

    const otherTeam = await projectRepository.findTeamByMember(
      institutionId,
      String(team.projectId),
      String(student._id),
    );
    if (otherTeam) {
      throw new ConflictError('You are already on a team for this project');
    }

    if (team.memberCount >= project.maximumTeamSize) {
      throw new ConflictError('Team is full');
    }

    await projectRepository.createMember({
      institutionId: oid(institutionId),
      teamId: team._id,
      projectId: team.projectId,
      studentId: student._id,
      role: input.role,
      invitationStatus: 'accepted',
      joinedAt: new Date(),
      approvedBy: oid(actor.userId),
    });

    const memberCount = team.memberCount + 1;
    const status =
      memberCount >= project.minimumTeamSize && team.status === 'approved'
        ? 'approved'
        : team.status;

    const doc = await projectRepository.updateTeamById(institutionId, input.teamId, {
      memberCount,
      status,
      updatedBy: oid(actor.userId),
    });
    if (!doc) throw new NotFoundError('Team not found');

    await this.audit('team_joined', actor, institutionId, {
      projectId: String(team.projectId),
      teamId: input.teamId,
      courseId: String(project.courseId),
      studentId: String(student._id),
    });

    eventBus.emit(EVENTS.PROJECT_TEAM_JOINED, {
      projectId: String(team.projectId),
      teamId: input.teamId,
      studentId: String(student._id),
      institutionId,
    });

    return toDto(doc);
  }

  async leaveTeam(teamId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can leave teams');
    }

    const team = await projectRepository.findTeamById(institutionId, teamId);
    if (!team) throw new NotFoundError('Team not found');

    const student = await this.resolveStudent(actor, institutionId);
    const member = await projectRepository.findMemberByTeamAndStudent(
      institutionId,
      teamId,
      String(student._id),
    );
    if (!member) {
      throw new NotFoundError('You are not a member of this team');
    }

    await projectRepository.softDeleteMember(institutionId, String(member._id));

    const remaining = await projectRepository.listMembersByTeam(institutionId, teamId);
    const memberCount = remaining.length;
    let leaderId = team.leaderId;
    if (String(leaderId) === String(student._id)) {
      leaderId = remaining[0]?.studentId ?? null;
      if (remaining[0]) {
        await projectRepository.updateMemberById(institutionId, String(remaining[0]._id), {
          role: 'leader',
        });
      }
    }

    const doc = await projectRepository.updateTeamById(institutionId, teamId, {
      memberCount,
      leaderId,
      status: memberCount === 0 ? 'rejected' : team.status,
      updatedBy: oid(actor.userId),
    });
    if (!doc) throw new NotFoundError('Team not found');

    await this.audit('team_left', actor, institutionId, {
      projectId: String(team.projectId),
      teamId,
      studentId: String(student._id),
    });

    return toDto(doc);
  }

  async removeTeamMember(teamId: string, studentId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const team = await projectRepository.findTeamById(institutionId, teamId);
    if (!team) throw new NotFoundError('Team not found');

    const project = await projectRepository.findProjectById(
      institutionId,
      String(team.projectId),
    );
    if (!project) throw new NotFoundError('Project not found');

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      if (String(team.leaderId) !== String(student._id)) {
        throw new ForbiddenError('Only the team leader can remove members');
      }
    } else {
      await this.assertProjectWriteAccess(project, actor, institutionId);
    }

    const member = await projectRepository.findMemberByTeamAndStudent(
      institutionId,
      teamId,
      studentId,
    );
    if (!member) throw new NotFoundError('Team member not found');

    await projectRepository.softDeleteMember(institutionId, String(member._id));
    const remaining = await projectRepository.listMembersByTeam(institutionId, teamId);
    let leaderId = team.leaderId;
    if (String(leaderId) === studentId) {
      leaderId = remaining[0]?.studentId ?? null;
    }

    const doc = await projectRepository.updateTeamById(institutionId, teamId, {
      memberCount: remaining.length,
      leaderId,
      updatedBy: oid(actor.userId),
    });
    if (!doc) throw new NotFoundError('Team not found');
    return toDto(doc);
  }

  async getTeam(teamId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const team = await projectRepository.findTeamById(institutionId, teamId);
    if (!team) throw new NotFoundError('Team not found');

    const project = await projectRepository.findProjectById(
      institutionId,
      String(team.projectId),
    );
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectReadAccess(project, actor, institutionId);

    return toDto(team);
  }

  async updateTeam(teamId: string, input: UpdateTeamInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const team = await projectRepository.findTeamById(institutionId, teamId);
    if (!team) throw new NotFoundError('Team not found');

    const project = await projectRepository.findProjectById(
      institutionId,
      String(team.projectId),
    );
    if (!project) throw new NotFoundError('Project not found');

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      if (String(team.leaderId) !== String(student._id)) {
        throw new ForbiddenError('Only the team leader can update the team');
      }
    } else {
      await this.assertProjectWriteAccess(project, actor, institutionId);
    }

    const updates: Record<string, unknown> = { updatedBy: oid(actor.userId) };
    if (input.teamName !== undefined) updates.teamName = input.teamName;
    if (input.repoLink !== undefined) updates.repoLink = input.repoLink ?? null;
    if (input.status !== undefined) updates.status = input.status;

    const doc = await projectRepository.updateTeamById(institutionId, teamId, updates);
    if (!doc) throw new NotFoundError('Team not found');
    return toDto(doc);
  }

  // --------------------------------------------------------------- submissions

  async listSubmissions(query: ProjectSubmissionListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const filter = projectRepository.buildSubmissionFilter(institutionId, query);

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      filter.studentId = student._id;
    } else if (!canManage(actor)) {
      const courseIds = await this.facultyCourseIds(actor, institutionId);
      const projects = await ProjectModel.find({
        institutionId: oid(institutionId),
        deletedAt: null,
        $or: [{ createdBy: oid(actor.userId) }, { courseId: { $in: courseIds } }],
      })
        .select('_id')
        .exec();
      mergeAnd(filter, { projectId: { $in: projects.map((p) => p._id) } });
    }

    const result = await projectRepository.listSubmissions(filter, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async getSubmission(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await projectRepository.findSubmissionById(institutionId, id);
    if (!doc) throw new NotFoundError('Submission not found');

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      if (String(doc.studentId) !== String(student._id)) {
        throw new ForbiddenError('Access denied');
      }
    } else if (!canManage(actor)) {
      const project = await projectRepository.findProjectById(
        institutionId,
        String(doc.projectId),
      );
      if (!project) throw new NotFoundError('Project not found');
      await this.assertProjectWriteAccess(project, actor, institutionId);
    }

    return toDto(doc);
  }

  async saveDraft(input: SaveProjectSubmissionDraftInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const project = await projectRepository.findProjectById(institutionId, input.projectId);
    if (!project) throw new NotFoundError('Project not found');
    if (project.status !== 'published' && project.status !== 'open') {
      throw new ForbiddenError('Project is not open for submissions');
    }

    const { student, teamId } = await this.resolveSubmissionContext(
      project,
      actor,
      institutionId,
    );

    const payload = {
      ...this.submissionPayload(input),
      updatedBy: oid(actor.userId),
    };

    const existing = await projectRepository.findDraftSubmission(
      input.projectId,
      teamId ? null : String(student._id),
      teamId ? String(teamId) : null,
      input.milestoneId ?? null,
    );

    if (existing) {
      const doc = await projectRepository.updateSubmissionById(
        institutionId,
        String(existing._id),
        payload,
      );
      if (!doc) throw new NotFoundError('Submission not found');
      return toDto(doc);
    }

    const attempts = await projectRepository.countAttempts(
      input.projectId,
      teamId ? null : String(student._id),
      teamId ? String(teamId) : null,
    );

    const doc = await projectRepository.createSubmission({
      institutionId: oid(institutionId),
      projectId: project._id,
      courseId: project.courseId,
      submittedBy: oid(actor.userId),
      studentId: teamId ? student._id : student._id,
      teamId,
      milestoneId: input.milestoneId ? oid(input.milestoneId) : null,
      attemptNumber: attempts + 1,
      submittedAt: null,
      status: 'draft',
      attachments: [],
      lateSubmission: false,
      createdBy: oid(actor.userId),
      ...payload,
    });

    return toDto(doc);
  }

  async submit(input: SubmitProjectInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const project = await projectRepository.findProjectById(institutionId, input.projectId);
    if (!project) throw new NotFoundError('Project not found');

    const { student, teamId } = await this.resolveSubmissionContext(
      project,
      actor,
      institutionId,
    );

    const window = evaluateSubmissionWindow({
      status: project.status as ProjectStatus,
      dueDate: project.dueDate ?? null,
      closeDate: project.closeDate ?? null,
      allowLateSubmission: project.lateSubmissionAllowed,
    });
    if (!window.allowed) {
      throw new ForbiddenError(window.reason ?? 'Submission not allowed');
    }

    const previousAttempts = await projectRepository.countAttempts(
      input.projectId,
      teamId ? null : String(student._id),
      teamId ? String(teamId) : null,
    );
    const attempt = evaluateAttempt({
      previousAttempts,
      maxAttempts: project.maxAttempts,
      allowResubmission: project.allowResubmission,
    });
    if (!attempt.allowed) {
      throw new ConflictError(attempt.reason ?? 'Submission not allowed');
    }

    const payload = {
      ...this.submissionPayload(input),
      lateSubmission: window.late,
      status: resolveSubmissionStatus(window.late),
      submittedAt: new Date(),
      attemptNumber: attempt.nextAttempt,
      updatedBy: oid(actor.userId),
    };

    const draft = await projectRepository.findDraftSubmission(
      input.projectId,
      teamId ? null : String(student._id),
      teamId ? String(teamId) : null,
      input.milestoneId ?? null,
    );

    const doc = draft
      ? await projectRepository.updateSubmissionById(institutionId, String(draft._id), {
          ...payload,
          submittedBy: oid(actor.userId),
        })
      : await projectRepository.createSubmission({
          institutionId: oid(institutionId),
          projectId: project._id,
          courseId: project.courseId,
          submittedBy: oid(actor.userId),
          studentId: student._id,
          teamId,
          milestoneId: input.milestoneId ? oid(input.milestoneId) : null,
          attachments: [],
          createdBy: oid(actor.userId),
          ...payload,
        });

    if (!doc) throw new NotFoundError('Submission not found');

    await projectRepository.updateProgress(institutionId, input.projectId, String(student._id), {
      status: 'submitted',
      submissionId: doc._id,
      lastActivityAt: new Date(),
    });

    await this.audit('submission_created', actor, institutionId, {
      projectId: input.projectId,
      submissionId: String(doc._id),
      courseId: String(project.courseId),
      studentId: String(student._id),
      metadata: { attemptNumber: attempt.nextAttempt, late: window.late },
    });

    eventBus.emit(EVENTS.PROJECT_SUBMITTED, {
      submissionId: String(doc._id),
      projectId: input.projectId,
      studentId: String(student._id),
      institutionId,
    });

    eventBus.emit(EVENTS.PROJECT_SUBMISSION_CREATED, {
      submissionId: String(doc._id),
      projectId: input.projectId,
      institutionId,
    });

    return toDto(doc);
  }

  async uploadSubmissionFile(
    submissionId: string,
    input: ProjectFileUploadInput,
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    const submission = await projectRepository.findSubmissionById(institutionId, submissionId);
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
      const project = await projectRepository.findProjectById(
        institutionId,
        String(submission.projectId),
      );
      if (!project) throw new NotFoundError('Project not found');
      await this.assertProjectWriteAccess(project, actor, institutionId);
    }

    const fileRef = await this.storeFile(
      input,
      `projects/${institutionId}/${String(submission.projectId)}/submissions/${submissionId}`,
      actor,
    );

    const doc = await projectRepository.pushSubmissionFile(
      institutionId,
      submissionId,
      fileRef as unknown as Record<string, unknown>,
    );
    if (!doc) throw new NotFoundError('Submission not found');

    await this.audit('attachment_uploaded', actor, institutionId, {
      projectId: String(submission.projectId),
      submissionId,
      courseId: String(submission.courseId),
      metadata: { fileName: fileRef.fileName, sizeBytes: fileRef.sizeBytes },
    });

    return toDto(doc);
  }

  async prepareGrade(
    submissionId: string,
    input: GradeProjectSubmissionInput,
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot grade submissions');
    }

    const submission = await projectRepository.findSubmissionById(institutionId, submissionId);
    if (!submission) throw new NotFoundError('Submission not found');
    if (submission.status === 'draft') {
      throw new ConflictError('Cannot grade a draft submission');
    }

    const project = await projectRepository.findProjectById(
      institutionId,
      String(submission.projectId),
    );
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(project, actor, institutionId);

    const outcome = resolveGradeOutcome({
      gradingMethod: input.gradingMethod,
      marksObtained: input.marksObtained,
      percentage: input.percentage,
      passed: input.passed,
      rubricScores: input.rubricScores,
      totalMarks: project.totalMarks,
      passingMarks: project.passingMarks,
      late: submission.lateSubmission,
      latePenaltyPercent: project.latePenalty ?? (project as { latePenaltyPercent?: number }).latePenaltyPercent ?? 0,
    });

    await projectRepository.softDeleteGradesForSubmission(submissionId);

    const grade = await projectRepository.createGrade({
      institutionId: oid(institutionId),
      projectId: submission.projectId,
      submissionId: submission._id,
      studentId: submission.studentId,
      teamId: submission.teamId,
      gradingMethod: input.gradingMethod,
      marksObtained: outcome.marksObtained,
      percentage: outcome.percentage,
      passed: outcome.passed,
      feedback: input.feedback ?? null,
      rubricScores: input.rubricScores,
      preparedForGradebook: false,
      gradedBy: oid(actor.userId),
      gradedAt: new Date(),
    });

    const doc = await projectRepository.updateSubmissionById(institutionId, submissionId, {
      gradeId: grade._id,
      status: input.returnToStudent ? 'returned' : 'graded',
      updatedBy: oid(actor.userId),
    });
    if (!doc) throw new NotFoundError('Submission not found');

    if (submission.studentId) {
      await projectRepository.updateProgress(
        institutionId,
        String(submission.projectId),
        String(submission.studentId),
        {
          status: 'graded',
          gradeId: grade._id,
          lastActivityAt: new Date(),
        },
      );
    }

    await this.audit('submission_graded', actor, institutionId, {
      projectId: String(submission.projectId),
      submissionId,
      courseId: String(submission.courseId),
      studentId: submission.studentId ? String(submission.studentId) : null,
      metadata: {
        gradingMethod: input.gradingMethod,
        marksObtained: outcome.marksObtained,
        preparedForGradebook: false,
      },
    });

    eventBus.emit(EVENTS.PROJECT_GRADED, {
      submissionId,
      projectId: String(submission.projectId),
      studentId: submission.studentId ? String(submission.studentId) : null,
      institutionId,
      gradeId: String(grade._id),
    });

    return { submission: toDto(doc), grade: toDto(grade) };
  }

  // ------------------------------------------------------------------- reviews

  async createReview(input: CreateReviewInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const project = await projectRepository.findProjectById(institutionId, input.projectId);
    if (!project) throw new NotFoundError('Project not found');

    const submission = await projectRepository.findSubmissionById(
      institutionId,
      input.submissionId,
    );
    if (!submission) throw new NotFoundError('Submission not found');

    if (input.reviewType === 'peer') {
      if (!project.allowPeerReview) {
        throw new ForbiddenError('Peer review is not enabled for this project');
      }
      if (actor.role !== 'student') {
        throw new ForbiddenError('Only students can submit peer reviews');
      }
      const student = await this.resolveStudent(actor, institutionId);
      if (String(submission.studentId) === String(student._id)) {
        throw new ForbiddenError('Cannot review your own submission');
      }
    } else if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot submit faculty reviews');
    }

    const reviewInput = input;

    const doc = await projectRepository.createReview({
      institutionId: oid(institutionId),
      projectId: oid(input.projectId),
      submissionId: oid(input.submissionId),
      reviewerId: oid(actor.userId),
      reviewType: input.reviewType,
      status: 'draft',
      score: reviewInput.score ?? null,
      feedback: reviewInput.feedback ?? null,
      suggestions: reviewInput.suggestions ?? null,
      approval: reviewInput.approval ?? null,
      revisionRequired: reviewInput.revisionRequired ?? false,
      rubricScores: input.rubricScores,
    });

    return toDto(doc);
  }

  async submitReview(id: string, input: SubmitReviewInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await projectRepository.findReviewById(institutionId, id);
    if (!existing) throw new NotFoundError('Review not found');
    if (String(existing.reviewerId) !== actor.userId && !canManage(actor)) {
      throw new ForbiddenError('Not allowed to submit this review');
    }

    const doc = await projectRepository.updateReviewById(institutionId, id, {
      status: 'submitted',
      score: input.score ?? existing.score,
      feedback: input.feedback ?? existing.feedback,
      suggestions: input.suggestions ?? existing.suggestions,
      approval: input.approval ?? existing.approval,
      revisionRequired: input.revisionRequired ?? existing.revisionRequired,
      rubricScores: input.rubricScores ?? existing.rubricScores,
      submittedAt: new Date(),
    });
    if (!doc) throw new NotFoundError('Review not found');

    await this.audit('review_submitted', actor, institutionId, {
      projectId: String(doc.projectId),
      submissionId: String(doc.submissionId),
      metadata: { reviewType: doc.reviewType },
    });

    eventBus.emit(EVENTS.PROJECT_REVIEW_SUBMITTED, {
      reviewId: id,
      projectId: String(doc.projectId),
      submissionId: String(doc.submissionId),
      institutionId,
    });

    return toDto(doc);
  }

  async getReview(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await projectRepository.findReviewById(institutionId, id);
    if (!doc) throw new NotFoundError('Review not found');

    const project = await projectRepository.findProjectById(
      institutionId,
      String(doc.projectId),
    );
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectReadAccess(project, actor, institutionId);

    return toDto(doc);
  }

  // ------------------------------------------------------------- import/export

  async import(input: ProjectImportConfirmInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot import projects');
    }

    const errors: { row: number; field?: string; message: string }[] = [];
    const projectIds: string[] = [];

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

        const doc = await projectRepository.createProject({
          institutionId: oid(institutionId),
          courseId: oid(row.courseId),
          moduleId: row.moduleId ? oid(row.moduleId) : null,
          lessonId: row.lessonId ? oid(row.lessonId) : null,
          title: row.title,
          description: row.description ?? null,
          projectType: row.projectType ?? 'team',
          status: input.publish ? 'published' : 'draft',
          publishDate: input.publish ? new Date() : null,
          totalMarks,
          passingMarks,
          dueDate: parseDate(row.dueDate),
          createdBy: oid(actor.userId),
          updatedBy: oid(actor.userId),
        });

        projectIds.push(String(doc._id));

        await this.audit('project_created', actor, institutionId, {
          projectId: String(doc._id),
          courseId: row.courseId,
          metadata: { source: 'import' },
        });

        eventBus.emit(EVENTS.PROJECT_CREATED, {
          projectId: String(doc._id),
          courseId: row.courseId,
          institutionId,
        });
      } catch (error) {
        logger.warn({ error, row: rowNumber }, 'Project import row failed');
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { imported: projectIds.length, failed: errors.length, errors, projectIds };
  }

  async export(query: ProjectExportQuery, actor: ActorContext) {
    requireTenant(actor);

    const listQuery = {
      courseId: query.courseId,
      status: query.status,
      page: 1,
      limit: 10000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    } as ProjectListQuery;

    const result = await this.list(listQuery, actor);
    const rows = result.items.map((item) =>
      Object.fromEntries(PROJECT_CSV_HEADERS.map((h) => [h, item[h]])),
    );

    if (query.format === 'csv') {
      return { data: rowsToCsv(rows), format: 'csv' as const, count: rows.length };
    }

    return { data: result.items, format: 'json' as const, count: result.items.length };
  }

  // ------------------------------------------------------------- dashboards

  async getStats(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) {
      throw new ForbiddenError('Institution-wide stats require manage permission');
    }
    const stats = await projectRepository.getStats(institutionId);
    const submissionRate = computeSubmissionRate(
      stats.totalSubmissions,
      stats.total * Math.max(stats.totalTeams, 1),
    );
    return { ...stats, submissionRate };
  }

  async getFacultyDashboard(actor: ActorContext): Promise<ProjectFacultyDashboard> {
    const institutionId = requireTenant(actor);
    const institutionOid = oid(institutionId);
    const courseIds = await this.facultyCourseIds(actor, institutionId);

    const ownership = {
      $or: [{ createdBy: oid(actor.userId) }, { courseId: { $in: courseIds } }],
    };

    const projects = await ProjectModel.find({
      institutionId: institutionOid,
      deletedAt: null,
      ...ownership,
    })
      .select('_id peerReviewsRequired')
      .exec();
    const projectIds = projects.map((p) => p._id);

    const submissionBase = {
      institutionId: institutionOid,
      deletedAt: null,
      projectId: { $in: projectIds },
    };

    const [
      projectsCreated,
      activeTeams,
      pendingReviews,
      pendingGrades,
    ] = await Promise.all([
      ProjectModel.countDocuments({
        institutionId: institutionOid,
        deletedAt: null,
        createdBy: oid(actor.userId),
      }),
      projectRepository.countTeams({
        ...submissionBase,
        status: { $in: ['approved', 'completed'] },
      }),
      projectRepository.countReviews({
        institutionId: institutionOid,
        deletedAt: null,
        projectId: { $in: projectIds },
        status: 'draft',
      }),
      projectRepository.countSubmissions({
        ...submissionBase,
        status: { $in: ['submitted', 'late'] },
        gradeId: null,
      }),
    ]);

    return {
      projectsCreated,
      pendingReviews,
      upcomingDeadlines: [],
      studentTeams: activeTeams,
      lateSubmissions: pendingGrades,
    };
  }

  async getStudentDashboard(actor: ActorContext): Promise<ProjectStudentDashboard> {
    const institutionId = requireTenant(actor);
    const institutionOid = oid(institutionId);
    const student = await this.resolveStudent(actor, institutionId);
    const courseIds = await this.enrolledCourseIds(student._id, institutionId);

    const [publishedProjects, submissions] = await Promise.all([
        ProjectModel.find({
          institutionId: institutionOid,
          deletedAt: null,
          status: { $in: ['published', 'open'] },
          courseId: { $in: courseIds },
        })
          .select('_id allowPeerReview peerReviewsRequired')
          .exec(),
        ProjectSubmissionModel.find({
          institutionId: institutionOid,
          deletedAt: null,
          studentId: student._id,
          status: { $ne: 'draft' },
        })
          .select('status projectId _id')
          .exec(),
      ]);

    return {
      myProjects: publishedProjects.length,
      currentTeam: null,
      milestones: [],
      upcomingDeadlines: [],
      submissionHistory: submissions.map((s) => ({
        submissionId: String(s._id),
        projectId: String(s.projectId),
        status: s.status,
        submittedAt: null,
      })),
      reviewFeedback: [],
    };
  }

  async getInstitutionDashboard(actor: ActorContext): Promise<ProjectInstitutionDashboard> {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) {
      throw new ForbiddenError('Institution dashboard requires manage permission');
    }

    const stats = await projectRepository.getStats(institutionId);
    const submissionRate = computeSubmissionRate(
      stats.totalSubmissions,
      stats.published * 10,
    );

    return {
      totalProjects: stats.total,
      published: stats.published,
      active: stats.totalTeams,
      completed: stats.closed,
      departments: stats.byDepartment,
      submissionRate,
      facultyParticipation: stats.byCourse.length,
    };
  }

  async listAudit(projectId: string | undefined, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) {
      throw new ForbiddenError('Audit log requires manage permission');
    }
    const rows = await projectRepository.listAudit(institutionId, projectId);
    return rows.map(toDto);
  }

  async getOwnProjects(query: ProjectListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can use the me endpoint');
    }

    const student = await this.resolveStudent(actor, institutionId);
    const courseIds = await this.enrolledCourseIds(student._id, institutionId);

    let filter = projectRepository.buildProjectFilter(institutionId, query);
    mergeAnd(filter, {
      courseId: { $in: courseIds },
      status: { $in: ['published', 'open'] },
    });

    const result = await projectRepository.listProjects(filter, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  // ----------------------------------------------------------- bulk operations

  async bulkPublish(ids: string[], actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') throw new ForbiddenError('Students cannot bulk publish');
    const modified = await projectRepository.bulkUpdateProjectStatus(institutionId, ids, 'published');
    for (const id of ids) {
      eventBus.emit(EVENTS.PROJECT_PUBLISHED, { projectId: id, institutionId });
    }
    return { modified };
  }

  async bulkArchive(ids: string[], actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') throw new ForbiddenError('Students cannot bulk archive');
    const modified = await projectRepository.bulkUpdateProjectStatus(institutionId, ids, 'archived');
    return { modified };
  }

  async bulkDelete(ids: string[], actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') throw new ForbiddenError('Students cannot bulk delete');
    const modified = await projectRepository.bulkSoftDeleteProjects(institutionId, ids);
    return { modified };
  }

  async bulkDuplicate(ids: string[], actor: ActorContext) {
    requireTenant(actor);
    if (actor.role === 'student') throw new ForbiddenError('Students cannot bulk duplicate');
    const duplicated: string[] = [];
    for (const id of ids) {
      const copy = await this.duplicate(id, actor);
      duplicated.push(String(copy.id));
    }
    return { duplicated, count: duplicated.length };
  }

  async bulkAssignFaculty(ids: string[], facultyIds: string[], actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') throw new ForbiddenError('Students cannot assign faculty');
    const modified = await projectRepository.bulkAssignFaculty(institutionId, ids, facultyIds);
    return { modified };
  }

  // -------------------------------------------------------------- team approval

  async approveTeam(teamId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const team = await projectRepository.findTeamById(institutionId, teamId);
    if (!team) throw new NotFoundError('Team not found');
    const project = await projectRepository.findProjectById(institutionId, String(team.projectId));
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(project, actor, institutionId);

    const doc = await projectRepository.updateTeamById(institutionId, teamId, {
      status: 'approved',
      updatedBy: oid(actor.userId),
    });
    if (!doc) throw new NotFoundError('Team not found');

    await this.audit('team_approved', actor, institutionId, {
      projectId: String(team.projectId),
      teamId,
      courseId: String(project.courseId),
    });

    return toDto(doc);
  }

  async rejectTeam(teamId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const team = await projectRepository.findTeamById(institutionId, teamId);
    if (!team) throw new NotFoundError('Team not found');
    const project = await projectRepository.findProjectById(institutionId, String(team.projectId));
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(project, actor, institutionId);

    const doc = await projectRepository.updateTeamById(institutionId, teamId, {
      status: 'rejected',
      updatedBy: oid(actor.userId),
    });
    if (!doc) throw new NotFoundError('Team not found');

    await this.audit('team_rejected', actor, institutionId, {
      projectId: String(team.projectId),
      teamId,
      courseId: String(project.courseId),
    });

    return toDto(doc);
  }

  async inviteMember(
    teamId: string,
    studentId: string,
    role: 'leader' | 'member',
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    const team = await projectRepository.findTeamById(institutionId, teamId);
    if (!team) throw new NotFoundError('Team not found');

    const project = await projectRepository.findProjectById(institutionId, String(team.projectId));
    if (!project) throw new NotFoundError('Project not found');

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      if (String(team.leaderId) !== String(student._id)) {
        throw new ForbiddenError('Only the team leader can invite members');
      }
    } else {
      await this.assertProjectWriteAccess(project, actor, institutionId);
    }

    const existing = await projectRepository.findMemberByTeamAndStudent(
      institutionId,
      teamId,
      studentId,
    );
    if (existing) throw new ConflictError('Student is already associated with this team');

    const doc = await projectRepository.createMember({
      institutionId: oid(institutionId),
      teamId: team._id,
      projectId: team.projectId,
      studentId: oid(studentId),
      role,
      invitationStatus: 'pending',
      joinedAt: new Date(),
    });

    return toDto(doc);
  }

  async acceptInvitation(memberId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const member = await projectRepository.findMemberById(institutionId, memberId);
    if (!member) throw new NotFoundError('Invitation not found');
    if (member.invitationStatus !== 'pending') {
      throw new ConflictError('Invitation is no longer pending');
    }

    const student = await this.resolveStudent(actor, institutionId);
    if (String(member.studentId) !== String(student._id)) {
      throw new ForbiddenError('You can only accept your own invitations');
    }

    const team = await projectRepository.findTeamById(institutionId, String(member.teamId));
    if (!team) throw new NotFoundError('Team not found');

    const doc = await projectRepository.updateMemberById(institutionId, memberId, {
      invitationStatus: 'accepted',
      approvedBy: oid(actor.userId),
    });
    if (!doc) throw new NotFoundError('Invitation not found');

    await projectRepository.updateTeamById(institutionId, String(member.teamId), {
      memberCount: team.memberCount + 1,
      updatedBy: oid(actor.userId),
    });

    await this.audit('team_joined', actor, institutionId, {
      projectId: String(member.projectId),
      teamId: String(member.teamId),
      studentId: String(student._id),
      metadata: { viaInvitation: true },
    });

    return toDto(doc);
  }

  async rejectInvitation(memberId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const member = await projectRepository.findMemberById(institutionId, memberId);
    if (!member) throw new NotFoundError('Invitation not found');
    if (member.invitationStatus !== 'pending') {
      throw new ConflictError('Invitation is no longer pending');
    }

    const student = await this.resolveStudent(actor, institutionId);
    if (String(member.studentId) !== String(student._id)) {
      throw new ForbiddenError('You can only reject your own invitations');
    }

    const doc = await projectRepository.updateMemberById(institutionId, memberId, {
      invitationStatus: 'rejected',
    });
    if (!doc) throw new NotFoundError('Invitation not found');
    return toDto(doc);
  }

  async transferLeadership(teamId: string, studentId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const team = await projectRepository.findTeamById(institutionId, teamId);
    if (!team) throw new NotFoundError('Team not found');

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      if (String(team.leaderId) !== String(student._id)) {
        throw new ForbiddenError('Only the current leader can transfer leadership');
      }
    }

    const target = await projectRepository.findMemberByTeamAndStudent(
      institutionId,
      teamId,
      studentId,
    );
    if (!target || target.invitationStatus !== 'accepted') {
      throw new NotFoundError('Target member not found on team');
    }

    const currentLeader = await projectRepository.findMemberByTeamAndStudent(
      institutionId,
      teamId,
      String(team.leaderId),
    );
    if (currentLeader) {
      await projectRepository.updateMemberById(institutionId, String(currentLeader._id), {
        role: 'member',
      });
    }

    await projectRepository.updateMemberById(institutionId, String(target._id), {
      role: 'leader',
    });

    const doc = await projectRepository.updateTeamById(institutionId, teamId, {
      leaderId: oid(studentId),
      updatedBy: oid(actor.userId),
    });
    if (!doc) throw new NotFoundError('Team not found');
    return toDto(doc);
  }

  async getMyTeams(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can list their teams');
    }

    const student = await this.resolveStudent(actor, institutionId);
    const members = await projectRepository.listMembersByStudent(
      institutionId,
      String(student._id),
    );

    const teams = await Promise.all(
      members.map(async (member) => {
        const team = await projectRepository.findTeamById(institutionId, String(member.teamId));
        if (!team) return null;
        const project = await projectRepository.findProjectById(
          institutionId,
          String(member.projectId),
        );
        return {
          ...toDto(team),
          member: toDto(member),
          project: project ? toDto(project) : null,
        };
      }),
    );

    return teams.filter(Boolean);
  }

  // ------------------------------------------------------------------- comments

  async listComments(projectId: string, submissionId: string | undefined, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const project = await projectRepository.findProjectById(institutionId, projectId);
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectReadAccess(project, actor, institutionId);

    const comments = await projectRepository.listComments(
      institutionId,
      projectId,
      submissionId ?? null,
    );
    return comments.map(toDto);
  }

  async createComment(
    input: {
      projectId: string;
      submissionId?: string | null;
      parentCommentId?: string | null;
      body: string;
      attachments?: string[];
    },
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    const project = await projectRepository.findProjectById(institutionId, input.projectId);
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectReadAccess(project, actor, institutionId);

    if (input.parentCommentId) {
      const parent = await projectRepository.findCommentById(
        institutionId,
        input.parentCommentId,
      );
      if (!parent) throw new NotFoundError('Parent comment not found');
    }

    const doc = await projectRepository.createComment({
      institutionId: oid(institutionId),
      projectId: oid(input.projectId),
      submissionId: input.submissionId ? oid(input.submissionId) : null,
      parentCommentId: input.parentCommentId ? oid(input.parentCommentId) : null,
      authorId: oid(actor.userId),
      authorRole: actor.role,
      body: input.body,
      attachments: input.attachments?.map((id) => oid(id)) ?? [],
      resolved: false,
    });

    await this.audit('comment_created', actor, institutionId, {
      projectId: input.projectId,
      submissionId: input.submissionId ?? null,
      courseId: String(project.courseId),
    });

    return toDto(doc);
  }

  async replyToComment(
    commentId: string,
    body: string,
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    const parent = await projectRepository.findCommentById(institutionId, commentId);
    if (!parent) throw new NotFoundError('Comment not found');

    return this.createComment(
      {
        projectId: String(parent.projectId),
        submissionId: parent.submissionId ? String(parent.submissionId) : null,
        parentCommentId: commentId,
        body,
      },
      actor,
    );
  }

  async resolveComment(commentId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Only faculty can resolve comments');
    }

    const comment = await projectRepository.findCommentById(institutionId, commentId);
    if (!comment) throw new NotFoundError('Comment not found');

    const project = await projectRepository.findProjectById(
      institutionId,
      String(comment.projectId),
    );
    if (!project) throw new NotFoundError('Project not found');
    await this.assertProjectWriteAccess(project, actor, institutionId);

    const doc = await projectRepository.updateCommentById(institutionId, commentId, {
      resolved: true,
    });
    if (!doc) throw new NotFoundError('Comment not found');
    return toDto(doc);
  }

  // ---------------------------------------------------------------- tags/categories

  async listTags(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const tags = await projectRepository.listTags(institutionId);
    return tags.map(toDto);
  }

  async createTag(input: { name: string; color?: string | null }, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const slug = generateSlug(input.name);
    const existing = await projectRepository.findTagBySlug(institutionId, slug);
    if (existing) throw new ConflictError('Tag already exists');

    const doc = await projectRepository.createTag({
      institutionId: oid(institutionId),
      name: input.name,
      slug,
      color: input.color ?? null,
    });
    return toDto(doc);
  }

  async listCategories(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const categories = await projectRepository.listCategories(institutionId);
    return categories.map(toDto);
  }

  async createCategory(
    input: { name: string; description?: string | null; color?: string | null },
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    const slug = generateSlug(input.name);
    const existing = await projectRepository.findCategoryBySlug(institutionId, slug);
    if (existing) throw new ConflictError('Category already exists');

    const doc = await projectRepository.createCategory({
      institutionId: oid(institutionId),
      name: input.name,
      slug,
      description: input.description ?? null,
      color: input.color ?? null,
    });
    return toDto(doc);
  }
}

export const projectService = new ProjectService();
