import { Types } from 'mongoose';
import { EVENTS } from '@learnova/events';
import type {
  AssignSeatingInput,
  CheckInExamInput,
  CreateExamInput,
  ExamBulkActionInput,
  ExamListQuery,
  ProctorEventInput,
  StartExamAttemptInput,
  SubmitExamAnswerInput,
  SubmitExamInput,
  UpdateExamInput,
} from '@learnova/validation';
import type {
  ExamFacultyDashboard,
  ExamInstitutionDashboard,
  ExamProctoringPolicy,
  ExamSchedule,
  ExamStatus,
  ExamStudentDashboard,
  AssessmentQuestionType,
} from '@learnova/types';
import { eventBus } from '../../events/index.js';
import { emitAttemptLive, emitExamLive } from '../../socket/exam-live.js';
import { CourseModel } from '../../models/course.model.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { ExamAttemptModel } from '../../models/exam-attempt.model.js';
import { ExamModel } from '../../models/exam.model.js';
import { ExamProctorSessionModel } from '../../models/exam-proctor-session.model.js';
import { FacultyModel } from '../../models/faculty.model.js';
import { StudentModel } from '../../models/student.model.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { examinationRepository } from '../../repositories/examination/index.js';
import { examinationEngine, rankMostIncorrectQuestions } from '../examination-engine/index.js';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  canTransitionExamStatus,
  ensureUniqueExamSlug,
  generateSlug,
  isExamPublished,
  pageMeta,
  parseDate,
  toExamScheduleDto,
} from './examination.helpers.js';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

const MANAGE_ROLES = new Set(['institution_admin', 'super_admin']);

const PROCTOR_TO_VIOLATION: Record<string, string> = {
  tab_switch: 'tab_switch',
  fullscreen_exit: 'fullscreen_exit',
  camera_off: 'camera_blocked',
  microphone_off: 'microphone_blocked',
  suspicious_activity: 'shortcut_attempt',
};

function mapViolationType(eventType: string): string | null {
  return PROCTOR_TO_VIOLATION[eventType] ?? null;
}

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

function toEvaluableQuestion(question: {
  _id: Types.ObjectId;
  questionType: string;
  marks: number;
  negativeMarks: number;
  options?: Array<{ id: string; isCorrect: boolean }>;
  matchPairs?: Array<{ id: string; left: string; right: string }>;
  fillBlankAnswers?: string[];
}) {
  return {
    id: String(question._id),
    questionType: question.questionType as AssessmentQuestionType,
    marks: question.marks,
    negativeMarks: question.negativeMarks,
    options: (question.options ?? []).map((o) => ({
      id: o.id,
      isCorrect: o.isCorrect,
    })),
    matchPairs: (question.matchPairs ?? []).map((p) => ({
      id: p.id,
      left: p.left,
      right: p.right,
    })),
    fillBlankAnswers: question.fillBlankAnswers ?? [],
  };
}

function toProctoringPolicy(proctoring: {
  mode: ExamProctoringPolicy['mode'];
  secureBrowser: ExamProctoringPolicy['secureBrowser'];
  requireWebcam: boolean;
  requireMicrophone: boolean;
  blockCopyPaste: boolean;
  blockRightClick: boolean;
  blockNewTabs: boolean;
  requireFullscreen: boolean;
  maxTabSwitches: number;
  autoTerminateOnViolation: boolean;
  invigilatorIds: Types.ObjectId[];
}): ExamProctoringPolicy {
  return {
    ...proctoring,
    invigilatorIds: proctoring.invigilatorIds.map(String),
  };
}

function scheduleFromDoc(exam: {
  schedule: {
    registrationOpensAt?: Date | null;
    registrationClosesAt?: Date | null;
    checkInOpensAt?: Date | null;
    startsAt: Date;
    endsAt: Date;
    lateEntryMinutes: number;
    gracePeriodMinutes: number;
  };
}): ExamSchedule {
  return toExamScheduleDto(exam.schedule) as ExamSchedule;
}

export class ExaminationService {
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

  private async assertExamWriteAccess(
    exam: { createdBy?: Types.ObjectId | null; courseId: Types.ObjectId },
    actor: ActorContext,
    institutionId: string,
  ): Promise<void> {
    if (canManage(actor)) return;
    if (actor.role !== 'faculty') {
      throw new ForbiddenError('Not allowed to modify this exam');
    }
    if (exam.createdBy && String(exam.createdBy) === actor.userId) return;

    const courseIds = await this.facultyCourseIds(actor, institutionId);
    if (courseIds.some((c) => String(c) === String(exam.courseId))) return;

    throw new ForbiddenError('Not allowed to modify this exam');
  }

  private async assertCourseWriteAccess(
    courseId: string,
    actor: ActorContext,
    institutionId: string,
  ): Promise<void> {
    if (canManage(actor)) return;
    if (actor.role !== 'faculty') {
      throw new ForbiddenError('Not allowed to create exams for this course');
    }
    const courseIds = await this.facultyCourseIds(actor, institutionId);
    if (!courseIds.some((c) => String(c) === courseId)) {
      throw new ForbiddenError('Not allowed to create exams for this course');
    }
  }

  private async scopeExamFilter(
    filter: Record<string, unknown>,
    actor: ActorContext,
    institutionId: string,
  ): Promise<Record<string, unknown>> {
    if (canManage(actor)) return filter;

    if (actor.role === 'faculty') {
      const courseIds = await this.facultyCourseIds(actor, institutionId);
      return {
        ...filter,
        $or: [{ createdBy: oid(actor.userId) }, { courseId: { $in: courseIds } }],
      };
    }

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      const enrolled = await EnrollmentModel.find({
        institutionId: oid(institutionId),
        studentId: student._id,
        status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
        deletedAt: null,
      })
        .select('courseId')
        .exec();
      return {
        ...filter,
        courseId: { $in: enrolled.map((e) => e.courseId) },
        status: { $in: ['published', 'in_progress', 'completed', 'scheduled'] },
      };
    }

    return filter;
  }

  private async assertExamReadAccess(
    exam: { createdBy?: Types.ObjectId | null; courseId: Types.ObjectId; status: string },
    actor: ActorContext,
    institutionId: string,
  ): Promise<void> {
    if (canManage(actor)) return;

    if (actor.role === 'faculty') {
      if (exam.createdBy && String(exam.createdBy) === actor.userId) return;
      const courseIds = await this.facultyCourseIds(actor, institutionId);
      if (courseIds.some((c) => String(c) === String(exam.courseId))) return;
      throw new ForbiddenError('Access denied');
    }

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      await this.assertEnrollment(institutionId, student._id, exam.courseId);
      if (!isExamPublished(exam.status as ExamStatus) && exam.status !== 'scheduled') {
        throw new ForbiddenError('Access denied');
      }
      return;
    }

    if (!isExamPublished(exam.status as ExamStatus)) {
      throw new ForbiddenError('Access denied');
    }
  }

  private async audit(
    event: Parameters<typeof examinationRepository.logAudit>[0]['event'],
    actor: ActorContext,
    institutionId: string,
    payload: {
      examId?: string | null;
      attemptId?: string | null;
      courseId?: string | null;
      metadata?: Record<string, unknown>;
    } = {},
  ) {
    await examinationRepository.logAudit({
      event,
      institutionId,
      examId: payload.examId ?? null,
      attemptId: payload.attemptId ?? null,
      courseId: payload.courseId ?? null,
      userId: actor.userId,
      email: actor.email,
      metadata: payload.metadata,
    });
  }

  private async ensureExamSlug(institutionId: string, title: string): Promise<string> {
    const baseSlug = generateSlug(title);
    return ensureUniqueExamSlug(institutionId, baseSlug, async (slug) => {
      const existing = await examinationRepository.findExamBySlug(institutionId, slug);
      return existing !== null;
    });
  }

  private async createSectionsForExam(
    institutionId: string,
    examId: Types.ObjectId,
    sections: CreateExamInput['sections'],
  ): Promise<Types.ObjectId[]> {
    const sectionIds: Types.ObjectId[] = [];
    for (const section of sections ?? []) {
      const doc = await examinationRepository.createSection({
        institutionId: oid(institutionId),
        examId,
        title: section.title,
        description: section.description ?? null,
        marks: section.marks ?? 0,
        questionCount: section.questionCount ?? section.questionIds?.length ?? 0,
        randomizeQuestions: section.randomizeQuestions ?? false,
        randomQuestionCount: section.randomQuestionCount ?? null,
        displayOrder: section.displayOrder ?? 0,
        questionIds: (section.questionIds ?? []).map(oid),
      });
      sectionIds.push(doc._id);
    }
    return sectionIds;
  }

  private buildScheduleInput(input: CreateExamInput['schedule']) {
    return {
      registrationOpensAt: parseDate(
        input.registrationOpensAt?.toISOString?.() ?? String(input.registrationOpensAt ?? ''),
      ),
      registrationClosesAt: parseDate(
        input.registrationClosesAt?.toISOString?.() ?? String(input.registrationClosesAt ?? ''),
      ),
      checkInOpensAt: parseDate(
        input.checkInOpensAt?.toISOString?.() ?? String(input.checkInOpensAt ?? ''),
      ),
      startsAt: parseDate(input.startsAt.toISOString?.() ?? String(input.startsAt))!,
      endsAt: parseDate(input.endsAt.toISOString?.() ?? String(input.endsAt))!,
      lateEntryMinutes: input.lateEntryMinutes,
      gracePeriodMinutes: input.gracePeriodMinutes,
    };
  }

  // ------------------------------------------------------------- CRUD

  async create(input: CreateExamInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    await this.assertCourseWriteAccess(input.courseId, actor, institutionId);

    const course = await CourseModel.findOne({
      _id: input.courseId,
      institutionId: oid(institutionId),
      deletedAt: null,
    }).exec();
    if (!course) throw new NotFoundError('Course not found');

    if (input.rules.passingMarks > input.rules.totalMarks) {
      throw new ValidationError('passingMarks cannot exceed totalMarks');
    }

    const slug = await this.ensureExamSlug(institutionId, input.title);

    const doc = await examinationRepository.createExam({
      institutionId: oid(institutionId),
      courseId: oid(input.courseId),
      moduleId: input.moduleId ? oid(input.moduleId) : null,
      lessonId: input.lessonId ? oid(input.lessonId) : null,
      title: input.title,
      slug,
      description: input.description ?? null,
      instructions: input.instructions ?? null,
      examType: input.examType,
      visibility: input.visibility,
      status: 'draft',
      schedule: this.buildScheduleInput(input.schedule),
      proctoring: input.proctoring,
      rules: input.rules,
      seatingEnabled: input.seatingEnabled,
      sectionIds: [],
      questionIds: (input.questionIds ?? []).map(oid),
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    const sectionIds = await this.createSectionsForExam(
      institutionId,
      doc._id,
      input.sections,
    );
    if (sectionIds.length > 0) {
      await examinationRepository.updateExamById(institutionId, String(doc._id), { sectionIds });
    }

    await this.audit('exam.created', actor, institutionId, {
      examId: String(doc._id),
      courseId: input.courseId,
    });

    eventBus.emit(EVENTS.EXAM_CREATED, {
      examId: String(doc._id),
      courseId: input.courseId,
      institutionId,
    });

    const refreshed = await examinationRepository.findExamById(institutionId, String(doc._id));
    return toDto(refreshed ?? doc);
  }

  async list(query: ExamListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let filter = examinationRepository.buildExamFilter(institutionId, query);
    filter = await this.scopeExamFilter(filter, actor, institutionId);

    const result = await examinationRepository.listExams(filter, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async get(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await examinationRepository.findExamById(institutionId, id);
    if (!doc) throw new NotFoundError('Exam not found');

    await this.assertExamReadAccess(doc, actor, institutionId);
    const sections = await examinationRepository.listSectionsByExam(institutionId, id);
    return { ...toDto(doc), sections: sections.map(toDto) };
  }

  async update(id: string, input: UpdateExamInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await examinationRepository.findExamById(institutionId, id);
    if (!existing) throw new NotFoundError('Exam not found');
    await this.assertExamWriteAccess(existing, actor, institutionId);

    const updates: Record<string, unknown> = { updatedBy: oid(actor.userId) };

    for (const key of [
      'title',
      'description',
      'instructions',
      'examType',
      'visibility',
      'seatingEnabled',
    ] as const) {
      if (input[key] !== undefined) updates[key] = input[key];
    }

    if (input.moduleId !== undefined) {
      updates.moduleId = input.moduleId ? oid(input.moduleId) : null;
    }
    if (input.lessonId !== undefined) {
      updates.lessonId = input.lessonId ? oid(input.lessonId) : null;
    }
    if (input.schedule !== undefined) {
      updates.schedule = this.buildScheduleInput(input.schedule);
    }
    if (input.proctoring !== undefined) updates.proctoring = input.proctoring;
    if (input.rules !== undefined) {
      const passingMarks = input.rules.passingMarks ?? existing.rules.passingMarks;
      const totalMarks = input.rules.totalMarks ?? existing.rules.totalMarks;
      if (passingMarks > totalMarks) {
        throw new ValidationError('passingMarks cannot exceed totalMarks');
      }
      updates.rules = { ...existing.rules, ...input.rules };
    }
    if (input.questionIds !== undefined) {
      updates.questionIds = input.questionIds.map(oid);
    }
    if (input.title && input.title !== existing.title) {
      updates.slug = await this.ensureExamSlug(institutionId, input.title);
    }

    const doc = await examinationRepository.updateExamById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Exam not found');

    if (input.sections !== undefined) {
      await examinationRepository.softDeleteSectionsByExam(institutionId, id);
      const sectionIds = await this.createSectionsForExam(institutionId, doc._id, input.sections);
      await examinationRepository.updateExamById(institutionId, id, { sectionIds });
    }

    await this.audit('exam.updated', actor, institutionId, {
      examId: id,
      courseId: String(doc.courseId),
    });

    const refreshed = await examinationRepository.findExamById(institutionId, id);
    return toDto(refreshed ?? doc);
  }

  async remove(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await examinationRepository.findExamById(institutionId, id);
    if (!existing) throw new NotFoundError('Exam not found');
    await this.assertExamWriteAccess(existing, actor, institutionId);

    const doc = await examinationRepository.softDeleteExam(institutionId, id);
    if (!doc) throw new NotFoundError('Exam not found');

    await this.audit('exam.deleted', actor, institutionId, {
      examId: id,
      courseId: String(doc.courseId),
    });

    return toDto(doc);
  }

  private async transition(id: string, to: ExamStatus, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await examinationRepository.findExamById(institutionId, id);
    if (!existing) throw new NotFoundError('Exam not found');
    await this.assertExamWriteAccess(existing, actor, institutionId);

    const from = existing.status as ExamStatus;
    if (!canTransitionExamStatus(from, to)) {
      throw new ConflictError(`Cannot change exam status from ${from} to ${to}`);
    }

    const doc = await examinationRepository.updateExamById(institutionId, id, {
      status: to,
      updatedBy: oid(actor.userId),
    });
    if (!doc) throw new NotFoundError('Exam not found');

    const auditEvent =
      to === 'published'
        ? 'exam.published'
        : to === 'scheduled'
          ? 'exam.scheduled'
          : to === 'cancelled'
            ? 'exam.cancelled'
            : to === 'completed'
              ? 'exam.completed'
              : 'exam.updated';

    await this.audit(auditEvent, actor, institutionId, {
      examId: id,
      courseId: String(doc.courseId),
      metadata: { from, to },
    });

    if (to === 'published') {
      eventBus.emit(EVENTS.EXAM_PUBLISHED, { examId: id, institutionId });
    } else if (to === 'scheduled') {
      eventBus.emit(EVENTS.EXAM_SCHEDULED, { examId: id, institutionId });
    } else if (to === 'cancelled') {
      eventBus.emit(EVENTS.EXAM_CANCELLED, { examId: id, institutionId });
    } else if (to === 'completed') {
      eventBus.emit(EVENTS.EXAM_COMPLETED, { examId: id, institutionId });
    }

    return toDto(doc);
  }

  async publish(id: string, actor: ActorContext) {
    return this.transition(id, 'published', actor);
  }

  async schedule(id: string, actor: ActorContext) {
    return this.transition(id, 'scheduled', actor);
  }

  async cancel(id: string, actor: ActorContext) {
    return this.transition(id, 'cancelled', actor);
  }

  async archive(id: string, actor: ActorContext) {
    return this.transition(id, 'archived', actor);
  }

  async duplicate(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await examinationRepository.findExamById(institutionId, id);
    if (!existing) throw new NotFoundError('Exam not found');
    await this.assertExamWriteAccess(existing, actor, institutionId);

    const slug = await this.ensureExamSlug(institutionId, `${existing.title} copy`);
    const doc = await examinationRepository.createExam({
      institutionId: existing.institutionId,
      courseId: existing.courseId,
      moduleId: existing.moduleId,
      lessonId: existing.lessonId,
      title: `${existing.title} (Copy)`,
      slug,
      description: existing.description,
      instructions: existing.instructions,
      examType: existing.examType,
      visibility: existing.visibility,
      status: 'draft',
      schedule: existing.schedule,
      proctoring: existing.proctoring,
      rules: existing.rules,
      seatingEnabled: existing.seatingEnabled,
      sectionIds: [],
      questionIds: existing.questionIds,
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    const sections = await examinationRepository.listSectionsByExam(institutionId, id);
    const sectionIds: Types.ObjectId[] = [];
    for (const section of sections) {
      const copy = await examinationRepository.createSection({
        institutionId: oid(institutionId),
        examId: doc._id,
        title: section.title,
        description: section.description,
        marks: section.marks,
        questionCount: section.questionCount,
        randomizeQuestions: section.randomizeQuestions,
        randomQuestionCount: section.randomQuestionCount,
        displayOrder: section.displayOrder,
        questionIds: section.questionIds,
      });
      sectionIds.push(copy._id);
    }
    if (sectionIds.length > 0) {
      await examinationRepository.updateExamById(institutionId, String(doc._id), { sectionIds });
    }

    await this.audit('exam.created', actor, institutionId, {
      examId: String(doc._id),
      courseId: String(doc.courseId),
      metadata: { sourceExamId: id },
    });

    return toDto(doc);
  }

  async bulkAction(input: ExamBulkActionInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot perform bulk exam actions');
    }

    const exams = await examinationRepository.findExamsByIds(institutionId, input.ids);
    if (exams.length !== input.ids.length) {
      throw new NotFoundError('One or more exams not found');
    }

    for (const exam of exams) {
      await this.assertExamWriteAccess(exam, actor, institutionId);
    }

    switch (input.action) {
      case 'publish': {
        const modified = await examinationRepository.bulkUpdateExamStatus(
          institutionId,
          input.ids,
          'published',
        );
        for (const examId of input.ids) {
          eventBus.emit(EVENTS.EXAM_PUBLISHED, { examId, institutionId });
        }
        return { action: input.action, modified };
      }
      case 'schedule': {
        const modified = await examinationRepository.bulkUpdateExamStatus(
          institutionId,
          input.ids,
          'scheduled',
        );
        return { action: input.action, modified };
      }
      case 'archive': {
        const modified = await examinationRepository.bulkUpdateExamStatus(
          institutionId,
          input.ids,
          'archived',
        );
        return { action: input.action, modified };
      }
      case 'cancel': {
        const modified = await examinationRepository.bulkUpdateExamStatus(
          institutionId,
          input.ids,
          'cancelled',
        );
        return { action: input.action, modified };
      }
      case 'delete': {
        const modified = await examinationRepository.bulkSoftDeleteExams(
          institutionId,
          input.ids,
        );
        return { action: input.action, modified };
      }
      case 'duplicate': {
        const created: string[] = [];
        for (const examId of input.ids) {
          const copy = await this.duplicate(examId, actor);
          created.push(String(copy.id));
        }
        return { action: input.action, created, count: created.length };
      }
      default:
        throw new ValidationError('Unsupported bulk action');
    }
  }

  // ------------------------------------------------------------- seating

  async assignSeating(input: AssignSeatingInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const exam = await examinationRepository.findExamById(institutionId, input.examId);
    if (!exam) throw new NotFoundError('Exam not found');
    await this.assertExamWriteAccess(exam, actor, institutionId);

    const assignments = [];
    for (const item of input.assignments) {
      const doc = await examinationRepository.upsertSeating({
        institutionId: oid(institutionId),
        examId: oid(input.examId),
        studentId: oid(item.studentId),
        seatNumber: item.seatNumber,
        room: item.room ?? null,
        row: item.row ?? null,
        column: item.column ?? null,
        checkedInAt: null,
      });
      assignments.push(toDto(doc));
    }

    return { examId: input.examId, assignments };
  }

  async listSeating(examId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const exam = await examinationRepository.findExamById(institutionId, examId);
    if (!exam) throw new NotFoundError('Exam not found');
    await this.assertExamReadAccess(exam, actor, institutionId);

    const seating = await examinationRepository.listSeatingByExam(institutionId, examId);
    return seating.map(toDto);
  }

  async checkIn(input: CheckInExamInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can check in to exams');
    }

    const exam = await examinationRepository.findExamById(institutionId, input.examId);
    if (!exam) throw new NotFoundError('Exam not found');

    const schedule = scheduleFromDoc(exam);
    if (!examinationEngine.canCheckIn(schedule)) {
      throw new ConflictError('Check-in is not open for this exam');
    }

    const student = await this.resolveStudent(actor, institutionId);
    await this.assertEnrollment(institutionId, student._id, exam.courseId);

    if (exam.seatingEnabled) {
      const seating = await examinationRepository.findSeating(
        institutionId,
        input.examId,
        String(student._id),
      );
      if (!seating) {
        throw new ForbiddenError('No seating assignment found for this exam');
      }
    }

    const checkedInAt = new Date();
    await examinationRepository.checkInSeating(
      institutionId,
      input.examId,
      String(student._id),
      checkedInAt,
    );

    const attempt = await examinationRepository.createAttempt({
      institutionId: oid(institutionId),
      examId: exam._id,
      studentId: student._id,
      courseId: exam.courseId,
      attemptNumber: 0,
      scheduledAt: exam.schedule.startsAt,
      checkedInAt,
      status: 'checked_in',
      score: 0,
      percentage: 0,
      timeTakenSeconds: 0,
      autoSubmitted: false,
      violationCount: 0,
    });

    await this.audit('attempt.checked_in', actor, institutionId, {
      examId: input.examId,
      attemptId: String(attempt._id),
      courseId: String(exam.courseId),
    });

    eventBus.emit(EVENTS.EXAM_CHECKED_IN, {
      examId: input.examId,
      attemptId: String(attempt._id),
      studentId: String(student._id),
      institutionId,
    });

    const isLate = checkedInAt > exam.schedule.startsAt;
    await examinationRepository.upsertAttendance({
      institutionId: oid(institutionId),
      examId: exam._id,
      studentId: student._id,
      attemptId: attempt._id,
      status: isLate ? 'late' : 'present',
      checkedInAt,
      autoRecorded: true,
    });

    emitExamLive(input.examId, 'live.attempt.updated', {
      attemptId: String(attempt._id),
      status: 'checked_in',
      studentId: String(student._id),
    });

    return toDto(attempt);
  }

  // ------------------------------------------------------------- attempts

  async startAttempt(input: StartExamAttemptInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can start exam attempts');
    }

    const exam = await examinationRepository.findExamById(institutionId, input.examId);
    if (!exam) throw new NotFoundError('Exam not found');

    if (!['published', 'in_progress'].includes(exam.status)) {
      throw new ConflictError('Exam is not available for attempts');
    }

    const schedule = scheduleFromDoc(exam);
    const window = examinationEngine.canStartExamAttempt(schedule);
    if (!window.allowed) {
      throw new ConflictError(window.reason ?? 'Exam window is not open');
    }

    const browserCheck = examinationEngine.validateSecureBrowser(
      exam.proctoring.secureBrowser,
      input.secureBrowserAcknowledged ?? false,
    );
    if (!browserCheck.allowed) {
      throw new ForbiddenError(browserCheck.reason ?? 'Secure browser required');
    }

    const student = await this.resolveStudent(actor, institutionId);
    await this.assertEnrollment(institutionId, student._id, exam.courseId);

    const existingCount = await examinationRepository.countStudentAttempts(
      input.examId,
      String(student._id),
    );
    if (
      !examinationEngine.canStartQuestionAttempt(existingCount, exam.rules.attemptLimit)
    ) {
      throw new ConflictError('Maximum attempt limit reached');
    }

    const attemptNumber = examinationEngine.nextQuestionAttemptNumber(existingCount);
    const startedAt = new Date();

    const attempt = await examinationRepository.createAttempt({
      institutionId: oid(institutionId),
      examId: exam._id,
      studentId: student._id,
      courseId: exam.courseId,
      attemptNumber,
      startedAt,
      status: 'started',
      score: 0,
      percentage: 0,
      timeTakenSeconds: 0,
      autoSubmitted: false,
      violationCount: 0,
    });

    if (exam.status === 'published') {
      await examinationRepository.updateExamById(institutionId, input.examId, {
        status: 'in_progress',
      });
    }

    const questionIds = exam.questionIds.map(String);
    const sections = await examinationRepository.listSectionsByExam(institutionId, input.examId);
    for (const section of sections) {
      for (const qid of section.questionIds) {
        if (!questionIds.includes(String(qid))) {
          questionIds.push(String(qid));
        }
      }
    }

    const selectedIds = examinationEngine.selectQuestionsForActivity(
      questionIds,
      sections.map((s) => ({
        questionIds: s.questionIds.map(String),
        randomizeQuestions: s.randomizeQuestions,
        randomQuestionCount: s.randomQuestionCount ?? null,
      })),
      exam.rules.shuffleQuestions,
    );
    const questions = await examinationRepository.findQuestionsByIds(
      institutionId,
      selectedIds,
    );
    const rendered = questions.map((q) =>
      examinationEngine.renderQuestionForAttempt(q, {
        shuffleOptions: exam.rules.shuffleOptions,
        hideCorrectAnswers: true,
      }),
    );

    await this.audit('attempt.started', actor, institutionId, {
      examId: input.examId,
      attemptId: String(attempt._id),
      courseId: String(exam.courseId),
      metadata: { attemptNumber },
    });

    eventBus.emit(EVENTS.EXAM_STARTED, {
      examId: input.examId,
      attemptId: String(attempt._id),
      studentId: String(student._id),
      institutionId,
    });

    emitExamLive(input.examId, 'live.attempt.updated', {
      attemptId: String(attempt._id),
      status: 'started',
      studentId: String(student._id),
    });
    emitAttemptLive(String(attempt._id), 'live.countdown', {
      remainingSeconds: examinationEngine.remainingAttemptSeconds(
        {
          activityId: input.examId,
          attemptId: String(attempt._id),
          studentId: String(student._id),
          startedAt,
          durationMinutes: exam.rules.durationMinutes,
        },
        startedAt,
      ),
    });

    return {
      attempt: toDto(attempt),
      questions: rendered,
      remainingSeconds: examinationEngine.remainingAttemptSeconds(
        {
          activityId: input.examId,
          attemptId: String(attempt._id),
          studentId: String(student._id),
          startedAt,
          durationMinutes: exam.rules.durationMinutes,
        },
        startedAt,
      ),
      proctoring: exam.proctoring,
    };
  }

  async saveAnswer(attemptId: string, input: SubmitExamAnswerInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can save answers');
    }

    const attempt = await examinationRepository.findAttemptById(institutionId, attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');

    const student = await this.resolveStudent(actor, institutionId);
    if (String(attempt.studentId) !== String(student._id)) {
      throw new ForbiddenError('Can only save answers for your own attempt');
    }

    if (attempt.status !== 'started') {
      throw new ConflictError('Attempt is no longer active');
    }

    const exam = await examinationRepository.findExamById(
      institutionId,
      String(attempt.examId),
    );
    if (!exam) throw new NotFoundError('Exam not found');

    const expired = examinationEngine.isTimedAttemptExpired(
      {
        activityId: String(exam._id),
        attemptId,
        studentId: String(student._id),
        startedAt: attempt.startedAt!,
        durationMinutes: exam.rules.durationMinutes,
      },
      new Date(),
    );
    if (expired) {
      throw new ConflictError('Attempt has expired');
    }

    const question = await examinationRepository.findQuestionsByIds(institutionId, [
      input.questionId,
    ]);
    if (!question[0]) throw new NotFoundError('Question not found');

    const evaluated = examinationEngine.evaluateQuestionAnswer(
      toEvaluableQuestion(question[0]),
      {
        questionId: input.questionId,
        selectedOptionIds: input.selectedOptionIds ?? [],
        textAnswer: input.textAnswer ?? null,
        matchAnswers: input.matchAnswers ?? {},
      },
      exam.rules.negativeMarking,
    );

    const answer = await examinationRepository.upsertAnswer(
      institutionId,
      attemptId,
      input.questionId,
      {
        selectedOptionIds: input.selectedOptionIds ?? [],
        textAnswer: input.textAnswer ?? null,
        matchAnswers: input.matchAnswers ?? {},
        isCorrect: evaluated.isCorrect,
        marksAwarded: evaluated.marksAwarded,
        timeSpentSeconds: input.timeSpentSeconds ?? 0,
      },
    );

    return toDto(answer);
  }

  async submitExam(input: SubmitExamInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can submit exams');
    }

    const attempt = await examinationRepository.findAttemptById(
      institutionId,
      input.attemptId,
    );
    if (!attempt) throw new NotFoundError('Attempt not found');

    const student = await this.resolveStudent(actor, institutionId);
    if (String(attempt.studentId) !== String(student._id)) {
      throw new ForbiddenError('Can only submit your own attempt');
    }

    if (attempt.status !== 'started') {
      throw new ConflictError('Attempt has already been submitted');
    }

    const exam = await examinationRepository.findExamById(
      institutionId,
      String(attempt.examId),
    );
    if (!exam) throw new NotFoundError('Exam not found');

    for (const answerInput of input.answers ?? []) {
      await this.saveAnswer(input.attemptId, answerInput, actor);
    }

    const savedAnswers = await examinationRepository.listAnswersByAttempt(input.attemptId);
    const questionIds = [...new Set(savedAnswers.map((a) => String(a.questionId)))];
    const questions = await examinationRepository.findQuestionsByIds(
      institutionId,
      questionIds,
    );

    const evaluable = questions.map(toEvaluableQuestion);
    const answerInputs = savedAnswers.map((a) => ({
      questionId: String(a.questionId),
      selectedOptionIds: a.selectedOptionIds ?? [],
      textAnswer: a.textAnswer ?? null,
      matchAnswers: (a.matchAnswers as Record<string, string>) ?? {},
    }));

    const result = examinationEngine.scoreQuestionAttempt(evaluable, answerInputs, {
      passingMarks: exam.rules.passingMarks,
      totalMarks: exam.rules.totalMarks,
      negativeMarking: exam.rules.negativeMarking,
    });

    const submittedAt = new Date();
    const timeTakenSeconds = examinationEngine.computeAttemptDurationSeconds(
      attempt.startedAt!,
      submittedAt,
    );

    const updatedAttempt = await examinationRepository.updateAttemptById(
      institutionId,
      input.attemptId,
      {
        status: 'completed',
        submittedAt,
        score: result.score,
        percentage: result.percentage,
        timeTakenSeconds,
        autoSubmitted: false,
      },
    );

    const examResult = await examinationRepository.createResult({
      institutionId: oid(institutionId),
      attemptId: oid(input.attemptId),
      examId: exam._id,
      studentId: student._id,
      totalQuestions: result.evaluated.length,
      correct: result.correct,
      incorrect: result.incorrect,
      skipped: result.skipped,
      score: result.score,
      percentage: result.percentage,
      passed: result.passed,
      rank: null,
      releasedAt:
        exam.rules.showResultsAfter === 'immediate' ? submittedAt : null,
    });

    await this.audit('attempt.submitted', actor, institutionId, {
      examId: String(exam._id),
      attemptId: input.attemptId,
      courseId: String(exam.courseId),
      metadata: { score: result.score, passed: result.passed },
    });

    eventBus.emit(EVENTS.EXAM_COMPLETED, {
      examId: String(exam._id),
      attemptId: input.attemptId,
      institutionId,
    });
    eventBus.emit(EVENTS.EXAM_SUBMITTED, {
      examId: String(exam._id),
      attemptId: input.attemptId,
      userId: String(student._id),
      institutionId,
    });
    eventBus.emit(EVENTS.EXAM_FINISHED, {
      examId: String(exam._id),
      attemptId: input.attemptId,
      userId: String(student._id),
      institutionId,
    });

    emitExamLive(String(exam._id), 'live.attempt.submitted', {
      attemptId: input.attemptId,
      studentId: String(student._id),
      score: result.score,
      passed: result.passed,
    });

    const response: Record<string, unknown> = {
      attempt: toDto(updatedAttempt!),
      result: toDto(examResult),
    };

    if (exam.rules.showResultsAfter === 'immediate') {
      response.summary = {
        score: result.score,
        percentage: result.percentage,
        passed: result.passed,
        correct: result.correct,
        incorrect: result.incorrect,
        skipped: result.skipped,
      };
    }

    return response;
  }

  async getAttempt(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const attempt = await examinationRepository.findAttemptById(institutionId, id);
    if (!attempt) throw new NotFoundError('Attempt not found');

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      if (String(attempt.studentId) !== String(student._id)) {
        throw new ForbiddenError('Access denied');
      }
    }

    const result = await examinationRepository.findResultByAttempt(id);
    const answers = await examinationRepository.listAnswersByAttempt(id);

    return {
      attempt: toDto(attempt),
      result: result ? toDto(result) : null,
      answers: answers.map(toDto),
    };
  }

  async listAttempts(
    query: { examId?: string; studentId?: string; page?: number; limit?: number },
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };

    if (query.examId) filter.examId = oid(query.examId);
    if (query.studentId) filter.studentId = oid(query.studentId);

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      filter.studentId = student._id;
    }

    const result = await examinationRepository.listAttempts(filter, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  // ------------------------------------------------------------- proctor

  async startProctorSession(attemptId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot start proctor sessions');
    }

    const attempt = await examinationRepository.findAttemptById(institutionId, attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');

    const session = await examinationRepository.createProctorSession({
      institutionId: oid(institutionId),
      examId: attempt.examId,
      attemptId: attempt._id,
      proctorId: oid(actor.userId),
      startedAt: new Date(),
      status: 'active',
    });

    await examinationRepository.updateAttemptById(institutionId, attemptId, {
      proctorSessionId: session._id,
    });

    await examinationRepository.createProctorEvent({
      institutionId: oid(institutionId),
      examId: attempt.examId,
      attemptId: attempt._id,
      proctorSessionId: session._id,
      eventType: 'session_started',
      severity: 'info',
      message: 'Proctor session started',
    });

    return toDto(session);
  }

  async logProctorEvent(input: ProctorEventInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const attempt = await examinationRepository.findAttemptById(
      institutionId,
      input.attemptId,
    );
    if (!attempt) throw new NotFoundError('Attempt not found');

    const exam = await examinationRepository.findExamById(
      institutionId,
      String(attempt.examId),
    );
    if (!exam) throw new NotFoundError('Exam not found');

    const event = await examinationRepository.createProctorEvent({
      institutionId: oid(institutionId),
      examId: attempt.examId,
      attemptId: attempt._id,
      proctorSessionId: attempt.proctorSessionId,
      eventType: input.eventType,
      severity: input.severity ?? 'info',
      message: input.message ?? null,
      metadata: input.metadata ?? {},
    });

    let updatedAttempt = attempt;
    const violationTypes = ['tab_switch', 'fullscreen_exit', 'camera_off', 'suspicious_activity'];
    if (violationTypes.includes(input.eventType)) {
      updatedAttempt =
        (await examinationRepository.incrementViolationCount(institutionId, input.attemptId)) ??
        attempt;

      const violation = examinationEngine.evaluateProctorViolation(
        toProctoringPolicy(exam.proctoring),
        updatedAttempt.violationCount,
      );

      const mappedType = mapViolationType(input.eventType);
      if (mappedType) {
        const autoAction = violation.terminate ? 'auto_submit' : 'warning';
        await examinationRepository.createViolation({
          institutionId: oid(institutionId),
          examId: attempt.examId,
          attemptId: attempt._id,
          studentId: attempt.studentId,
          violationType: mappedType,
          severity: input.severity === 'critical' ? 'critical' : 'medium',
          screenshotUrl: null,
          autoAction,
          metadata: input.metadata ?? {},
        });

        await this.audit('violation.recorded', actor, institutionId, {
          examId: String(attempt.examId),
          attemptId: input.attemptId,
          metadata: { violationType: mappedType, autoAction },
        });

        eventBus.emit(EVENTS.VIOLATION_RECORDED, {
          examId: String(attempt.examId),
          attemptId: input.attemptId,
          violationType: mappedType,
          severity: input.severity,
          institutionId,
        });
        eventBus.emit(EVENTS.VIOLATION_DETECTED, {
          examId: String(attempt.examId),
          attemptId: input.attemptId,
          violationType: mappedType,
          autoAction,
          institutionId,
        });

        emitExamLive(String(attempt.examId), 'live.violation.recorded', {
          attemptId: input.attemptId,
          violationType: mappedType,
          severity: input.severity ?? 'medium',
          violationCount: updatedAttempt.violationCount,
        });
      }

      if (violation.terminate) {
        await this.terminateAttempt(input.attemptId, violation.reason ?? 'Proctor violation', actor);
      }
    }

    if (input.eventType === 'manual_flag') {
      await this.audit('proctor.flagged', actor, institutionId, {
        examId: String(attempt.examId),
        attemptId: input.attemptId,
      });
      eventBus.emit(EVENTS.EXAM_PROCTOR_FLAGGED, {
        examId: String(attempt.examId),
        attemptId: input.attemptId,
        institutionId,
      });
    }

    if (input.eventType === 'manual_clear') {
      await this.audit('proctor.cleared', actor, institutionId, {
        examId: String(attempt.examId),
        attemptId: input.attemptId,
      });
    }

    return toDto(event);
  }

  async flagAttempt(attemptId: string, message: string | null, actor: ActorContext) {
    return this.logProctorEvent(
      {
        attemptId,
        eventType: 'manual_flag',
        severity: 'warning',
        message,
        metadata: {},
      },
      actor,
    );
  }

  async clearAttempt(attemptId: string, message: string | null, actor: ActorContext) {
    return this.logProctorEvent(
      {
        attemptId,
        eventType: 'manual_clear',
        severity: 'info',
        message,
        metadata: {},
      },
      actor,
    );
  }

  async terminateAttempt(attemptId: string, reason: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const attempt = await examinationRepository.findAttemptById(institutionId, attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');

    const updated = await examinationRepository.updateAttemptById(institutionId, attemptId, {
      status: 'terminated',
      terminatedReason: reason,
      submittedAt: new Date(),
    });

    if (attempt.proctorSessionId) {
      await examinationRepository.closeProctorSession(
        institutionId,
        String(attempt.proctorSessionId),
        new Date(),
      );
    }

    await examinationRepository.createProctorEvent({
      institutionId: oid(institutionId),
      examId: attempt.examId,
      attemptId: attempt._id,
      proctorSessionId: attempt.proctorSessionId,
      eventType: 'attempt_terminated',
      severity: 'critical',
      message: reason,
    });

    await this.audit('proctor.flagged', actor, institutionId, {
      examId: String(attempt.examId),
      attemptId,
      metadata: { reason },
    });

    eventBus.emit(EVENTS.EXAM_PROCTOR_TERMINATED, {
      examId: String(attempt.examId),
      attemptId,
      institutionId,
    });

    return toDto(updated!);
  }

  // ------------------------------------------------------------- analytics / dashboards

  async getAnalytics(examId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const exam = await examinationRepository.findExamById(institutionId, examId);
    if (!exam) throw new NotFoundError('Exam not found');
    await this.assertExamReadAccess(exam, actor, institutionId);

    const analytics = await examinationRepository.getExamAnalytics(institutionId, examId);
    const mostIncorrect = rankMostIncorrectQuestions(analytics.questionStats, 5).map((q) => ({
      questionId: q.questionId,
      title: q.title,
      incorrectRate: q.incorrectRate,
    }));

    return {
      examId,
      ...analytics,
      mostIncorrect,
    };
  }

  async listAudit(actor: ActorContext, examId?: string) {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) {
      throw new ForbiddenError('Institution admin access required');
    }
    const logs = await examinationRepository.listAudit(institutionId, examId);
    return logs.map((log) => toDto(log as { _id: Types.ObjectId }));
  }

  async getFacultyDashboard(actor: ActorContext): Promise<ExamFacultyDashboard> {
    const institutionId = requireTenant(actor);
    const institutionOid = oid(institutionId);
    const courseIds = await this.facultyCourseIds(actor, institutionId);

    const ownership = {
      $or: [{ createdBy: oid(actor.userId) }, { courseId: { $in: courseIds } }],
    };

    const [examsScheduled, examsInProgress, attemptStats, violationAgg] = await Promise.all([
      ExamModel.countDocuments({
        institutionId: institutionOid,
        deletedAt: null,
        status: 'scheduled',
        ...ownership,
      }),
      ExamModel.countDocuments({
        institutionId: institutionOid,
        deletedAt: null,
        status: 'in_progress',
        ...ownership,
      }),
      ExamAttemptModel.aggregate<{ total: number; avg: number | null }>([
        {
          $match: {
            institutionId: institutionOid,
            status: { $in: ['submitted', 'completed'] },
          },
        },
        { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: '$percentage' } } },
      ]),
      ExamAttemptModel.aggregate<{ violations: number; total: number }>([
        { $match: { institutionId: institutionOid } },
        {
          $group: {
            _id: null,
            violations: { $sum: '$violationCount' },
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = attemptStats[0];
    const violations = violationAgg[0];

    return {
      examsScheduled,
      examsInProgress,
      totalAttempts: stats?.total ?? 0,
      averageScore: stats?.avg != null ? Math.round(stats.avg * 100) / 100 : 0,
      violationRate:
        violations && violations.total > 0
          ? Math.round((violations.violations / violations.total) * 10000) / 100
          : 0,
    };
  }

  async getStudentDashboard(actor: ActorContext): Promise<ExamStudentDashboard> {
    const institutionId = requireTenant(actor);
    const student = await this.resolveStudent(actor, institutionId);
    const institutionOid = oid(institutionId);
    const now = new Date();

    const [upcomingExams, checkedInExams, completedExams, avgScore, recentAttempts] =
      await Promise.all([
        ExamModel.countDocuments({
          institutionId: institutionOid,
          deletedAt: null,
          status: { $in: ['published', 'scheduled'] },
          'schedule.startsAt': { $gt: now },
        }),
        ExamAttemptModel.countDocuments({
          institutionId: institutionOid,
          studentId: student._id,
          status: 'checked_in',
        }),
        ExamAttemptModel.countDocuments({
          institutionId: institutionOid,
          studentId: student._id,
          status: { $in: ['submitted', 'completed'] },
        }),
        ExamAttemptModel.aggregate<{ avg: number | null }>([
          {
            $match: {
              institutionId: institutionOid,
              studentId: student._id,
              status: { $in: ['submitted', 'completed'] },
            },
          },
          { $group: { _id: null, avg: { $avg: '$percentage' } } },
        ]),
        ExamAttemptModel.find({
          institutionId: institutionOid,
          studentId: student._id,
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .exec(),
      ]);

    return {
      upcomingExams,
      checkedInExams,
      completedExams,
      averageScore:
        avgScore[0]?.avg != null ? Math.round(avgScore[0].avg * 100) / 100 : 0,
      recentAttempts: recentAttempts.map(
        (a) => toDto(a) as unknown as ExamStudentDashboard['recentAttempts'][number],
      ),
    };
  }

  async getInstitutionDashboard(actor: ActorContext): Promise<ExamInstitutionDashboard> {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) {
      throw new ForbiddenError('Institution admin access required');
    }

    const institutionOid = oid(institutionId);
    const [totalExams, scheduledExams, attemptStats, passRateAgg, proctoredSessions] =
      await Promise.all([
        ExamModel.countDocuments({ institutionId: institutionOid, deletedAt: null }),
        ExamModel.countDocuments({
          institutionId: institutionOid,
          deletedAt: null,
          status: 'scheduled',
        }),
        ExamAttemptModel.aggregate<{ total: number; avg: number | null }>([
          {
            $match: {
              institutionId: institutionOid,
              status: { $in: ['submitted', 'completed'] },
            },
          },
          { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: '$percentage' } } },
        ]),
        ExamModel.aggregate([
          { $match: { institutionId: institutionOid, deletedAt: null } },
          {
            $lookup: {
              from: 'exam_results',
              localField: '_id',
              foreignField: 'examId',
              as: 'results',
            },
          },
          { $unwind: { path: '$results', preserveNullAndEmptyArrays: false } },
          {
            $group: {
              _id: null,
              passed: { $sum: { $cond: ['$results.passed', 1, 0] } },
              total: { $sum: 1 },
            },
          },
        ]),
        ExamProctorSessionModel.countDocuments({ institutionId: institutionOid }),
      ]);

    const stats = attemptStats[0];
    const passRow = passRateAgg[0] as { passed: number; total: number } | undefined;

    return {
      totalExams,
      scheduledExams,
      totalAttempts: stats?.total ?? 0,
      averageScore: stats?.avg != null ? Math.round(stats.avg * 100) / 100 : 0,
      passRate: passRow ? (passRow.passed / passRow.total) * 100 : 0,
      proctoredSessions,
    };
  }

  async reportStudentViolation(
    attemptId: string,
    input: { violationType: string; message?: string | null; metadata?: Record<string, unknown> },
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can report violations during an attempt');
    }
    const attempt = await examinationRepository.findAttemptById(institutionId, attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');
    const student = await this.resolveStudent(actor, institutionId);
    if (String(attempt.studentId) !== String(student._id)) {
      throw new ForbiddenError('Can only report violations for your own attempt');
    }

    const eventMap: Record<string, string> = {
      fullscreen_exit: 'fullscreen_exit',
      tab_switch: 'tab_switch',
      camera_blocked: 'camera_off',
      microphone_blocked: 'microphone_off',
      clipboard_attempt: 'suspicious_activity',
      shortcut_attempt: 'suspicious_activity',
      browser_resize: 'suspicious_activity',
      multiple_faces: 'suspicious_activity',
      face_missing: 'suspicious_activity',
    };

    return this.logProctorEvent(
      {
        attemptId,
        eventType: eventMap[input.violationType] ?? 'suspicious_activity',
        severity: 'warning',
        message: input.message ?? input.violationType,
        metadata: { ...input.metadata, violationType: input.violationType, reportedBy: 'student' },
      },
      actor,
    );
  }

  async getLiveMonitoring(examId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const exam = await examinationRepository.findExamById(institutionId, examId);
    if (!exam) throw new NotFoundError('Exam not found');

    const snapshot = await examinationRepository.getLiveSnapshot(institutionId, examId);
    return {
      examId,
      title: exam.title,
      status: snapshot.status,
      endsAt: snapshot.endsAt,
      stats: snapshot.stats,
      attempts: snapshot.attempts.map((a) => toDto(a)),
      recentViolations: snapshot.recentViolations.map((v) => toDto(v)),
    };
  }

  async listViolations(examId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const rows = await examinationRepository.listViolations(institutionId, examId);
    return rows.map((r) => toDto(r));
  }

  async listAttendance(examId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const rows = await examinationRepository.listAttendance(institutionId, examId);
    return rows.map((r) => toDto(r));
  }

  async listPolicies(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const rows = await examinationRepository.listPolicies(institutionId);
    return rows.map((r) => toDto(r));
  }

  async createPolicy(
    input: {
      name: string;
      description?: string | null;
      attemptLimit?: number;
      negativeMarking?: boolean;
      secureBrowser?: string;
      requireWebcam?: boolean;
      requireMicrophone?: boolean;
    },
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    if (!canManage(actor) && actor.role !== 'faculty') {
      throw new ForbiddenError('Cannot create exam policies');
    }
    const doc = await examinationRepository.createPolicy({
      institutionId: oid(institutionId),
      name: input.name,
      description: input.description ?? null,
      attemptLimit: input.attemptLimit ?? 1,
      negativeMarking: input.negativeMarking ?? false,
      createdBy: oid(actor.userId),
      deletedAt: null,
      ...(input.secureBrowser ? { secureBrowser: input.secureBrowser } : {}),
      ...(input.requireWebcam !== undefined ? { requireWebcam: input.requireWebcam } : {}),
      ...(input.requireMicrophone !== undefined ? { requireMicrophone: input.requireMicrophone } : {}),
    });
    return toDto(doc);
  }
}

export const examinationService = new ExaminationService();
