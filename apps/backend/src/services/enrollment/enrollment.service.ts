import { Types } from 'mongoose';
import { EVENTS } from '@learnova/events';
import type {
  CreateEnrollmentInput,
  EnrollmentBulkEnrollInput,
  EnrollmentBulkApproveInput,
  EnrollmentBulkRejectInput,
  EnrollmentBulkIdsInput,
  EnrollmentBulkAssignFacultyInput,
  EnrollmentListQuery,
  EnrollmentSearchQuery,
  EnrollmentExportQuery,
  EnrollmentImportConfirmInput,
  UpdateEnrollmentInput,
  EnrollmentSelfEnrollInput,
} from '@learnova/validation';
import { eventBus } from '../../events/index.js';
import { CourseModel } from '../../models/course.model.js';
import { StudentModel } from '../../models/student.model.js';
import { FacultyModel } from '../../models/faculty.model.js';
import { logger } from '../../utils/logger/index.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { enrollmentRepository } from '../../repositories/enrollment/index.js';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

function requireTenant(actor: ActorContext): string {
  if (!actor.institutionId) {
    throw new ForbiddenError('Institution context required');
  }
  return actor.institutionId;
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

  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value instanceof Types.ObjectId) {
      normalized[key] = String(value);
    } else if (value instanceof Date) {
      normalized[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      normalized[key] = value.map((item) =>
        item instanceof Types.ObjectId ? String(item) : item,
      );
    } else {
      normalized[key] = value;
    }
  }

  return {
    id: String(_id),
    ...normalized,
    deletedAt:
      rest.deletedAt instanceof Date
        ? rest.deletedAt.toISOString()
        : (rest.deletedAt ?? null),
  };
}

function pageMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

const CSV_HEADERS = [
  'studentId',
  'courseId',
  'status',
  'enrollmentMethod',
  'enrollmentDate',
  'approvalStatus',
  'facultyId',
  'progress',
  'grade',
  'score',
  'credits',
] as const;

function escapeCsv(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function rowsToCsv(rows: Array<Record<string, unknown>>): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rows) {
    lines.push(CSV_HEADERS.map((h) => escapeCsv(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function scopeByFacultyAccess(
  filter: Record<string, unknown>,
  actor: ActorContext,
  institutionId: string,
): Promise<Record<string, unknown>> {
  if (actor.role !== 'faculty') return filter;

  const facultyRecord = await FacultyModel.findOne({
    institutionId: new Types.ObjectId(institutionId),
    email: actor.email.toLowerCase(),
    deletedAt: null,
  }).exec();

  if (!facultyRecord) {
    filter._id = null;
    return filter;
  }

  const courses = await CourseModel.find({
    institutionId: new Types.ObjectId(institutionId),
    deletedAt: null,
    $or: [
      { facultyIds: facultyRecord._id },
      { coordinatorId: facultyRecord._id },
    ],
  })
    .select('_id')
    .exec();

  const courseIds = courses.map((c) => c._id);
  if (courseIds.length === 0) {
    filter._id = null;
    return filter;
  }

  filter.courseId = { $in: courseIds };
  return filter;
}

async function scopeByStudentAccess(
  filter: Record<string, unknown>,
  actor: ActorContext,
  institutionId: string,
): Promise<Record<string, unknown>> {
  if (actor.role !== 'student') return filter;

  const studentRecord = await StudentModel.findOne({
    institutionId: new Types.ObjectId(institutionId),
    email: actor.email.toLowerCase(),
    deletedAt: null,
  }).exec();

  if (!studentRecord) {
    filter._id = null;
    return filter;
  }

  filter.studentId = studentRecord._id;
  return filter;
}

export class EnrollmentService {
  private async audit(
    event: Parameters<typeof enrollmentRepository.logAudit>[0]['event'],
    actor: ActorContext,
    institutionId: string,
    enrollmentId?: string | null,
    studentId?: string | null,
    courseId?: string | null,
    metadata?: Record<string, unknown>,
  ) {
    await enrollmentRepository.logAudit({
      event,
      institutionId,
      enrollmentId,
      studentId,
      courseId,
      userId: actor.userId,
      email: actor.email,
      metadata,
    });
  }

  async create(input: CreateEnrollmentInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);

    const existing = await enrollmentRepository.findActiveByStudentCourse(
      institutionId,
      input.studentId,
      input.courseId,
    );
    if (existing) {
      throw new ConflictError('Student is already enrolled in this course');
    }

    const student = await StudentModel.findOne({
      _id: input.studentId,
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    }).exec();
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const course = await CourseModel.findOne({
      _id: input.courseId,
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    }).exec();
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const doc = await enrollmentRepository.create({
      ...input,
      institutionId: new Types.ObjectId(institutionId),
      studentId: new Types.ObjectId(input.studentId),
      courseId: new Types.ObjectId(input.courseId),
      campusId: input.campusId ? new Types.ObjectId(input.campusId) : student.campusId,
      schoolId: input.schoolId ? new Types.ObjectId(input.schoolId) : student.schoolId,
      departmentId: input.departmentId
        ? new Types.ObjectId(input.departmentId)
        : student.departmentId,
      programId: input.programId ? new Types.ObjectId(input.programId) : student.programId,
      semesterId: input.semesterId
        ? new Types.ObjectId(input.semesterId)
        : student.semesterId,
      sectionId: input.sectionId ? new Types.ObjectId(input.sectionId) : student.sectionId,
      batchId: input.batchId ? new Types.ObjectId(input.batchId) : student.batchId,
      facultyId: input.facultyId ? new Types.ObjectId(input.facultyId) : null,
      enrollmentDate: input.enrollmentDate ?? new Date(),
      enrollmentMethod: input.enrollmentMethod ?? 'manual',
      createdBy: new Types.ObjectId(actor.userId),
    });

    await this.audit('enrollment_created', actor, institutionId, String(doc._id), input.studentId, input.courseId);

    eventBus.emit(EVENTS.ENROLLMENT_CREATED, {
      enrollmentId: String(doc._id),
      studentId: input.studentId,
      courseId: input.courseId,
      institutionId,
    });

    if (doc.status === 'active' || doc.status === 'approved') {
      eventBus.emit(EVENTS.COURSE_ENROLLED, {
        enrollmentId: String(doc._id),
        studentId: input.studentId,
        courseId: input.courseId,
        institutionId,
      });
    }

    return toDto(doc);
  }

  async list(query: EnrollmentListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let filter = enrollmentRepository.buildFilter(institutionId, query);

    filter = await scopeByFacultyAccess(filter, actor, institutionId);
    filter = await scopeByStudentAccess(filter, actor, institutionId);

    const result = await enrollmentRepository.list(institutionId, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async search(q: string, page: number, limit: number, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const query = { q, page, limit, sortBy: 'createdAt', sortOrder: 'desc' } as EnrollmentListQuery;
    return this.list(query, actor);
  }

  async get(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await enrollmentRepository.findById(institutionId, id);
    if (!doc) throw new NotFoundError('Enrollment not found');

    if (actor.role === 'student') {
      const studentRecord = await StudentModel.findOne({
        institutionId: new Types.ObjectId(institutionId),
        email: actor.email.toLowerCase(),
        deletedAt: null,
      }).exec();
      if (!studentRecord || String(doc.studentId) !== String(studentRecord._id)) {
        throw new ForbiddenError('Access denied');
      }
    } else if (actor.role === 'faculty') {
      const facultyRecord = await FacultyModel.findOne({
        institutionId: new Types.ObjectId(institutionId),
        email: actor.email.toLowerCase(),
        deletedAt: null,
      }).exec();
      if (!facultyRecord) throw new ForbiddenError('Faculty record not found');

      const course = await CourseModel.findOne({
        _id: doc.courseId,
        institutionId: new Types.ObjectId(institutionId),
        deletedAt: null,
        $or: [
          { facultyIds: facultyRecord._id },
          { coordinatorId: facultyRecord._id },
        ],
      }).exec();
      if (!course) throw new ForbiddenError('Access denied');
    }

    return toDto(doc);
  }

  async update(id: string, input: UpdateEnrollmentInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await enrollmentRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Enrollment not found');

    const updates: Record<string, unknown> = {
      ...input,
      updatedBy: new Types.ObjectId(actor.userId),
    };

    if (input.facultyId !== undefined) {
      updates.facultyId = input.facultyId ? new Types.ObjectId(input.facultyId) : null;
    }

    const doc = await enrollmentRepository.updateById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Enrollment not found');

    await this.audit('enrollment_updated', actor, institutionId, id, String(doc.studentId), String(doc.courseId));

    eventBus.emit(EVENTS.ENROLLMENT_UPDATED, {
      enrollmentId: id,
      institutionId,
    });

    return toDto(doc);
  }

  async archive(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await enrollmentRepository.softDelete(institutionId, id);
    if (!doc) throw new NotFoundError('Enrollment not found');

    await this.audit('enrollment_deleted', actor, institutionId, id, String(doc.studentId), String(doc.courseId));

    eventBus.emit(EVENTS.ENROLLMENT_DELETED, {
      enrollmentId: id,
      institutionId,
    });

    return toDto(doc);
  }

  async restore(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await enrollmentRepository.restore(institutionId, id);
    if (!doc) throw new NotFoundError('Enrollment not found');

    await this.audit('enrollment_restored', actor, institutionId, id, String(doc.studentId), String(doc.courseId));

    return toDto(doc);
  }

  async approve(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await enrollmentRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Enrollment not found');

    const doc = await enrollmentRepository.updateById(institutionId, id, {
      status: 'approved',
      approvalStatus: 'approved',
      approvalDate: new Date(),
      approvedBy: new Types.ObjectId(actor.userId),
    });
    if (!doc) throw new NotFoundError('Enrollment not found');

    await this.audit('enrollment_approved', actor, institutionId, id, String(doc.studentId), String(doc.courseId));

    eventBus.emit(EVENTS.ENROLLMENT_APPROVED, {
      enrollmentId: id,
      institutionId,
    });

    eventBus.emit(EVENTS.COURSE_ENROLLED, {
      enrollmentId: id,
      studentId: String(doc.studentId),
      courseId: String(doc.courseId),
      institutionId,
    });

    return toDto(doc);
  }

  async reject(id: string, reason: string | null, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await enrollmentRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Enrollment not found');

    const doc = await enrollmentRepository.updateById(institutionId, id, {
      status: 'rejected',
      approvalStatus: 'rejected',
      approvalDate: new Date(),
      approvedBy: new Types.ObjectId(actor.userId),
      rejectionReason: reason ?? null,
    });
    if (!doc) throw new NotFoundError('Enrollment not found');

    await this.audit('enrollment_rejected', actor, institutionId, id, String(doc.studentId), String(doc.courseId), { reason });

    eventBus.emit(EVENTS.ENROLLMENT_REJECTED, {
      enrollmentId: id,
      institutionId,
    });

    return toDto(doc);
  }

  async withdraw(id: string, reason: string | null, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await enrollmentRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Enrollment not found');

    if (actor.role === 'student') {
      const studentRecord = await StudentModel.findOne({
        institutionId: new Types.ObjectId(institutionId),
        email: actor.email.toLowerCase(),
        deletedAt: null,
      }).exec();
      if (!studentRecord || String(existing.studentId) !== String(studentRecord._id)) {
        throw new ForbiddenError('Can only withdraw own enrollments');
      }

      const course = await CourseModel.findOne({
        _id: existing.courseId,
        institutionId: new Types.ObjectId(institutionId),
        deletedAt: null,
      }).exec();
      if (course?.enrollmentDeadline && new Date() > course.enrollmentDeadline) {
        throw new ForbiddenError('Enrollment deadline has passed');
      }
    }

    const doc = await enrollmentRepository.updateById(institutionId, id, {
      status: 'withdrawn',
      withdrawalDate: new Date(),
      withdrawalReason: reason ?? null,
    });
    if (!doc) throw new NotFoundError('Enrollment not found');

    await this.audit('enrollment_withdrawn', actor, institutionId, id, String(doc.studentId), String(doc.courseId), { reason });

    eventBus.emit(EVENTS.ENROLLMENT_WITHDRAWN, {
      enrollmentId: id,
      institutionId,
    });

    await this.autoPromoteFromWaitlist(String(doc.courseId), actor);

    return toDto(doc);
  }

  async complete(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await enrollmentRepository.findById(institutionId, id);
    if (!existing) throw new NotFoundError('Enrollment not found');

    const doc = await enrollmentRepository.updateById(institutionId, id, {
      status: 'completed',
      completionStatus: 'completed',
      completionDate: new Date(),
      progress: 100,
    });
    if (!doc) throw new NotFoundError('Enrollment not found');

    await this.audit('enrollment_completed', actor, institutionId, id, String(doc.studentId), String(doc.courseId));

    eventBus.emit(EVENTS.ENROLLMENT_COMPLETED, {
      enrollmentId: id,
      institutionId,
    });

    return toDto(doc);
  }

  async selfEnroll(input: EnrollmentSelfEnrollInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can self-enroll');
    }

    const studentRecord = await StudentModel.findOne({
      institutionId: new Types.ObjectId(institutionId),
      email: actor.email.toLowerCase(),
      deletedAt: null,
    }).exec();
    if (!studentRecord) {
      throw new NotFoundError('Student record not found');
    }

    const course = await CourseModel.findOne({
      _id: input.courseId,
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    }).exec();
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    if (course.enrollmentDeadline && new Date() > course.enrollmentDeadline) {
      throw new ForbiddenError('Enrollment deadline has passed');
    }

    if (course.enrollmentMode === 'closed') {
      throw new ForbiddenError('Course enrollment is closed');
    }

    if (course.enrollmentMode === 'invite') {
      throw new ForbiddenError('Course requires invitation');
    }

    const existing = await enrollmentRepository.findActiveByStudentCourse(
      institutionId,
      String(studentRecord._id),
      input.courseId,
    );
    if (existing) {
      throw new ConflictError('Already enrolled in this course');
    }

    if (course.maxStudents) {
      const activeCount = await enrollmentRepository.countActiveEnrollments(
        institutionId,
        input.courseId,
      );
      if (activeCount >= course.maxStudents) {
        if (course.waitlistEnabled) {
          const waitlistEntry = await enrollmentRepository.waitlistJoin(
            institutionId,
            String(studentRecord._id),
            input.courseId,
          );
          await this.audit('waitlist_joined', actor, institutionId, null, String(studentRecord._id), input.courseId);
          return { waitlisted: true, position: waitlistEntry.position };
        }
        throw new ForbiddenError('Course is full');
      }
    }

    const status = course.enrollmentMode === 'approval' ? 'pending' : 'active';
    const approvalStatus = course.enrollmentMode === 'approval' ? 'pending' : 'approved';

    const doc = await enrollmentRepository.create({
      institutionId: new Types.ObjectId(institutionId),
      studentId: studentRecord._id,
      courseId: new Types.ObjectId(input.courseId),
      campusId: studentRecord.campusId,
      schoolId: studentRecord.schoolId,
      departmentId: studentRecord.departmentId,
      programId: studentRecord.programId,
      semesterId: studentRecord.semesterId,
      sectionId: studentRecord.sectionId,
      batchId: studentRecord.batchId,
      status,
      approvalStatus,
      enrollmentMethod: 'self',
      enrollmentDate: new Date(),
      createdBy: new Types.ObjectId(actor.userId),
    });

    await this.audit('enrollment_created', actor, institutionId, String(doc._id), String(studentRecord._id), input.courseId);

    eventBus.emit(EVENTS.ENROLLMENT_CREATED, {
      enrollmentId: String(doc._id),
      studentId: String(studentRecord._id),
      courseId: input.courseId,
      institutionId,
    });

    if (status === 'active') {
      eventBus.emit(EVENTS.COURSE_ENROLLED, {
        enrollmentId: String(doc._id),
        studentId: String(studentRecord._id),
        courseId: input.courseId,
        institutionId,
      });
    }

    return toDto(doc);
  }

  async joinWaitlist(courseId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can join waitlist');
    }

    const studentRecord = await StudentModel.findOne({
      institutionId: new Types.ObjectId(institutionId),
      email: actor.email.toLowerCase(),
      deletedAt: null,
    }).exec();
    if (!studentRecord) {
      throw new NotFoundError('Student record not found');
    }

    const course = await CourseModel.findOne({
      _id: courseId,
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    }).exec();
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    if (!course.waitlistEnabled) {
      throw new ForbiddenError('Waitlist is not enabled for this course');
    }

    const entry = await enrollmentRepository.waitlistJoin(
      institutionId,
      String(studentRecord._id),
      courseId,
    );

    await this.audit('waitlist_joined', actor, institutionId, null, String(studentRecord._id), courseId);

    return { position: entry.position, status: entry.status };
  }

  async leaveWaitlist(courseId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can leave waitlist');
    }

    const studentRecord = await StudentModel.findOne({
      institutionId: new Types.ObjectId(institutionId),
      email: actor.email.toLowerCase(),
      deletedAt: null,
    }).exec();
    if (!studentRecord) {
      throw new NotFoundError('Student record not found');
    }

    const success = await enrollmentRepository.waitlistLeave(
      institutionId,
      String(studentRecord._id),
      courseId,
    );
    if (!success) {
      throw new NotFoundError('Waitlist entry not found');
    }

    await this.audit('waitlist_left', actor, institutionId, null, String(studentRecord._id), courseId);

    return { success: true };
  }

  async getWaitlist(courseId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const entries = await enrollmentRepository.waitlistList(institutionId, courseId);
    return entries.map((e) => ({
      id: String(e._id),
      studentId: String(e.studentId),
      courseId: String(e.courseId),
      position: e.position,
      status: e.status,
      joinedAt: e.joinedAt.toISOString(),
    }));
  }

  private async autoPromoteFromWaitlist(courseId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const next = await enrollmentRepository.waitlistPromoteNext(institutionId, courseId);
    if (!next) return;

    const course = await CourseModel.findOne({
      _id: courseId,
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    }).exec();
    if (!course) return;

    const student = await StudentModel.findOne({
      _id: next.studentId,
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
    }).exec();
    if (!student) return;

    const status = course.enrollmentMode === 'approval' ? 'pending' : 'active';
    const approvalStatus = course.enrollmentMode === 'approval' ? 'pending' : 'approved';

    const doc = await enrollmentRepository.create({
      institutionId: new Types.ObjectId(institutionId),
      studentId: next.studentId,
      courseId: new Types.ObjectId(courseId),
      campusId: student.campusId,
      schoolId: student.schoolId,
      departmentId: student.departmentId,
      programId: student.programId,
      semesterId: student.semesterId,
      sectionId: student.sectionId,
      batchId: student.batchId,
      status,
      approvalStatus,
      enrollmentMethod: 'promoted',
      enrollmentDate: new Date(),
      createdBy: new Types.ObjectId(actor.userId),
    });

    await this.audit('waitlist_promoted', actor, institutionId, String(doc._id), String(next.studentId), courseId);
    await this.audit('enrollment_created', actor, institutionId, String(doc._id), String(next.studentId), courseId);

    eventBus.emit(EVENTS.ENROLLMENT_CREATED, {
      enrollmentId: String(doc._id),
      studentId: String(next.studentId),
      courseId,
      institutionId,
    });
  }

  async bulkEnroll(input: EnrollmentBulkEnrollInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const results: Array<{ studentId: string; courseId: string; success: boolean; error?: string }> = [];

    for (const item of input.enrollments) {
      try {
        await this.create(
          {
            studentId: item.studentId,
            courseId: item.courseId,
            status: item.status ?? 'active',
            enrollmentMethod: 'bulk',
          },
          actor,
        );
        results.push({ studentId: item.studentId, courseId: item.courseId, success: true });
      } catch (error) {
        results.push({
          studentId: item.studentId,
          courseId: item.courseId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await this.audit('enrollment_bulk_created', actor, institutionId, null, null, null, { count: results.filter((r) => r.success).length });

    return { results };
  }

  async bulkApprove(input: EnrollmentBulkApproveInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let count = 0;

    for (const id of input.ids) {
      try {
        await this.approve(id, actor);
        count++;
      } catch (error) {
        logger.warn({ error, enrollmentId: id }, 'Failed to approve enrollment');
      }
    }

    await this.audit('enrollment_bulk_approved', actor, institutionId, null, null, null, { count });

    return { count };
  }

  async bulkReject(input: EnrollmentBulkRejectInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let count = 0;

    for (const id of input.ids) {
      try {
        await this.reject(id, input.reason ?? null, actor);
        count++;
      } catch (error) {
        logger.warn({ error, enrollmentId: id }, 'Failed to reject enrollment');
      }
    }

    await this.audit('enrollment_bulk_rejected', actor, institutionId, null, null, null, { count });

    return { count };
  }

  async bulkDelete(input: EnrollmentBulkIdsInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const count = await enrollmentRepository.bulkArchive(institutionId, input.ids);

    await this.audit('enrollment_bulk_deleted', actor, institutionId, null, null, null, { count });

    eventBus.emit(EVENTS.ENROLLMENT_DELETED, { institutionId });

    return { count };
  }

  async bulkAssignFaculty(input: EnrollmentBulkAssignFacultyInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const count = await enrollmentRepository.bulkAssignFaculty(
      institutionId,
      input.ids,
      input.facultyId ?? null,
    );

    await this.audit('enrollment_bulk_faculty_assigned', actor, institutionId, null, null, null, { count, facultyId: input.facultyId });

    return { count };
  }

  async getStats(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const stats = await enrollmentRepository.getStats(institutionId);
    return {
      ...stats,
      recentEnrollments: stats.recentEnrollments.map(toDto),
    };
  }

  async previewImport(input: EnrollmentImportConfirmInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    return {
      total: input.data.length,
      preview: input.data.slice(0, 10),
    };
  }

  async import(input: EnrollmentImportConfirmInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const results: Array<{ row: number; success: boolean; error?: string }> = [];
    const created: string[] = [];

    for (let i = 0; i < input.data.length; i++) {
      const row = input.data[i];
      try {
        const doc = await enrollmentRepository.create({
          institutionId: new Types.ObjectId(institutionId),
          studentId: new Types.ObjectId(row.studentId),
          courseId: new Types.ObjectId(row.courseId),
          status: row.status ?? 'active',
          enrollmentMethod: 'import',
          enrollmentDate: row.enrollmentDate ? new Date(row.enrollmentDate) : new Date(),
          createdBy: new Types.ObjectId(actor.userId),
        });
        created.push(String(doc._id));
        results.push({ row: i + 1, success: true });
      } catch (error) {
        results.push({
          row: i + 1,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (input.rollbackOnError) {
          for (const id of created) {
            await enrollmentRepository.hardDelete(institutionId, id);
          }
          throw new ValidationError(`Import failed at row ${i + 1}, rolled back`);
        }
      }
    }

    await this.audit('enrollment_imported', actor, institutionId, null, null, null, { total: input.data.length, success: results.filter((r) => r.success).length });

    eventBus.emit(EVENTS.ENROLLMENT_IMPORTED, {
      institutionId,
      count: results.filter((r) => r.success).length,
    });

    return { results };
  }

  async export(query: EnrollmentExportQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const listQuery = { ...query, page: 1, limit: 10000 } as EnrollmentListQuery;
    const result = await this.list(listQuery, actor);

    const format = query.format ?? 'csv';
    if (format === 'csv') {
      const csv = rowsToCsv(result.items);
      await this.audit('enrollment_exported', actor, institutionId, null, null, null, { format, count: result.items.length });
      eventBus.emit(EVENTS.ENROLLMENT_EXPORTED, { institutionId });
      return { data: csv, format: 'csv' };
    }

    throw new ValidationError('Unsupported export format');
  }

  async listAudit(enrollmentId: string | undefined, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const logs = await enrollmentRepository.listAudit(institutionId, enrollmentId);
    return logs.map((log) => ({
      id: String(log._id),
      event: log.event,
      institutionId: String(log.institutionId),
      enrollmentId: log.enrollmentId ? String(log.enrollmentId) : null,
      studentId: log.studentId ? String(log.studentId) : null,
      courseId: log.courseId ? String(log.courseId) : null,
      userId: log.userId ? String(log.userId) : null,
      email: log.email,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  async getOwnEnrollments(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can view own enrollments');
    }

    const query = { page: 1, limit: 1000, sortBy: 'createdAt', sortOrder: 'desc' } as EnrollmentListQuery;
    return this.list(query, actor);
  }
}

export const enrollmentService = new EnrollmentService();
