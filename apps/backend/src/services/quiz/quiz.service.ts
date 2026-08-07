import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import type { z } from 'zod';
import { EVENTS } from '@learnova/events';
import type {
  CreateQuestionBankInput,
  CreateQuestionInput,
  CreateQuizInput,
  QuizBulkActionInput,
  QuizListQuery,
  StartAttemptInput,
  SubmitAnswerInput,
  SubmitQuizInput,
  UpdateQuestionBankInput,
  UpdateQuestionInput,
  UpdateQuizInput,
  questionListQuerySchema,
  quizExportQuerySchema,
  quizImportConfirmSchema,
} from '@learnova/validation';
import type {
  QuizFacultyDashboard,
  QuizInstitutionDashboard,
  QuizStatus,
  QuizStudentDashboard,
} from '@learnova/types';
import { eventBus } from '../../events/index.js';
import { CourseModel } from '../../models/course.model.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { FacultyModel } from '../../models/faculty.model.js';
import { QuestionBankModel } from '../../models/question-bank.model.js';
import { QuizAttemptModel } from '../../models/quiz-attempt.model.js';
import { QuizModel } from '../../models/quiz.model.js';
import { StudentModel } from '../../models/student.model.js';
import { logger } from '../../utils/logger/index.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { quizRepository } from '../../repositories/quiz/index.js';
import { rankMostIncorrectQuestions } from '@learnova/shared';
import { quizEngine } from '../quiz-engine/index.js';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  QUIZ_CSV_HEADERS,
  canTransitionStatus,
  ensureUniqueQuizSlug,
  generateSlug,
  isClosed,
  pageMeta,
  parseDate,
  rowsToCsv,
} from './quiz.helpers.js';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

export type QuizExportQuery = z.infer<typeof quizExportQuerySchema>;
export type QuizImportConfirmInput = z.infer<typeof quizImportConfirmSchema>;

type QuestionListQuery = z.infer<typeof questionListQuerySchema>;

const MANAGE_ROLES = new Set(['institution_admin', 'super_admin']);

interface PendingImport {
  institutionId: string;
  userId: string;
  quizzes: CreateQuizInput[];
  createdAt: Date;
}

const pendingImports = new Map<string, PendingImport>();

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

function newOptionId(): string {
  return new Types.ObjectId().toHexString();
}

export class QuizService {
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

  private async assertQuizWriteAccess(
    quiz: { createdBy?: Types.ObjectId | null; courseId: Types.ObjectId },
    actor: ActorContext,
    institutionId: string,
  ): Promise<void> {
    if (canManage(actor)) return;
    if (actor.role !== 'faculty') {
      throw new ForbiddenError('Not allowed to modify this quiz');
    }
    if (quiz.createdBy && String(quiz.createdBy) === actor.userId) return;

    const courseIds = await this.facultyCourseIds(actor, institutionId);
    if (courseIds.some((c) => String(c) === String(quiz.courseId))) return;

    throw new ForbiddenError('Not allowed to modify this quiz');
  }

  private async assertCourseWriteAccess(
    courseId: string,
    actor: ActorContext,
    institutionId: string,
  ): Promise<void> {
    if (canManage(actor)) return;
    if (actor.role !== 'faculty') {
      throw new ForbiddenError('Not allowed to create quizzes for this course');
    }
    const courseIds = await this.facultyCourseIds(actor, institutionId);
    if (!courseIds.some((c) => String(c) === courseId)) {
      throw new ForbiddenError('Not allowed to create quizzes for this course');
    }
  }

  private async scopeQuizFilter(
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

  private async assertQuizReadAccess(
    quiz: { createdBy?: Types.ObjectId | null; courseId: Types.ObjectId; status: string },
    actor: ActorContext,
    institutionId: string,
  ): Promise<void> {
    if (canManage(actor)) return;

    if (actor.role === 'faculty') {
      if (quiz.createdBy && String(quiz.createdBy) === actor.userId) return;
      const courseIds = await this.facultyCourseIds(actor, institutionId);
      const ownsCourse = courseIds.some((c) => String(c) === String(quiz.courseId));
      if (ownsCourse && quiz.status !== 'draft') return;
      throw new ForbiddenError('Access denied');
    }

    if (actor.role === 'student') {
      if (quiz.status !== 'published') {
        throw new ForbiddenError('Quiz is not available');
      }
      const student = await this.resolveStudent(actor, institutionId);
      await this.assertEnrollment(institutionId, student._id, quiz.courseId);
      return;
    }

    if (quiz.status !== 'published') {
      throw new ForbiddenError('Access denied');
    }
  }

  private async audit(
    event: Parameters<typeof quizRepository.logAudit>[0]['event'],
    actor: ActorContext,
    institutionId: string,
    payload: {
      quizId?: string | null;
      questionId?: string | null;
      attemptId?: string | null;
      courseId?: string | null;
      metadata?: Record<string, unknown>;
    } = {},
  ) {
    await quizRepository.logAudit({
      event,
      institutionId,
      quizId: payload.quizId ?? null,
      questionId: payload.questionId ?? null,
      attemptId: payload.attemptId ?? null,
      courseId: payload.courseId ?? null,
      userId: actor.userId,
      email: actor.email,
      metadata: payload.metadata,
    });
  }

  private async ensureQuizSlug(institutionId: string, title: string): Promise<string> {
    const baseSlug = generateSlug(title);
    return ensureUniqueQuizSlug(institutionId, baseSlug, async (slug) => {
      const existing = await quizRepository.findQuizBySlug(institutionId, slug);
      return existing !== null;
    });
  }

  private mapQuestionOptions(
    options: CreateQuestionInput['options'],
  ): Array<Record<string, unknown>> {
    return (options ?? []).map((opt: NonNullable<CreateQuestionInput['options']>[number], index: number) => ({
      id: opt.id ?? newOptionId(),
      optionText: opt.optionText,
      isCorrect: opt.isCorrect ?? false,
      displayOrder: opt.displayOrder ?? index,
      feedback: opt.feedback ?? null,
    }));
  }

  private mapMatchPairs(
    pairs: CreateQuestionInput['matchPairs'],
  ): Array<Record<string, unknown>> {
    return (pairs ?? []).map((pair: NonNullable<CreateQuestionInput['matchPairs']>[number], index: number) => ({
      id: pair.id ?? newOptionId(),
      left: pair.left,
      right: pair.right,
      displayOrder: pair.displayOrder ?? index,
    }));
  }

  private async createSectionsForQuiz(
    institutionId: string,
    quizId: Types.ObjectId,
    sections: CreateQuizInput['sections'],
  ): Promise<Types.ObjectId[]> {
    const sectionIds: Types.ObjectId[] = [];
    for (const section of sections ?? []) {
      const doc = await quizRepository.createSection({
        institutionId: oid(institutionId),
        quizId,
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

  // ------------------------------------------------------------- quizzes CRUD

  async create(input: CreateQuizInput, actor: ActorContext) {
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

    const slug = await this.ensureQuizSlug(institutionId, input.title);

    const doc = await quizRepository.createQuiz({
      institutionId: oid(institutionId),
      courseId: oid(input.courseId),
      moduleId: input.moduleId ? oid(input.moduleId) : null,
      lessonId: input.lessonId ? oid(input.lessonId) : null,
      title: input.title,
      slug,
      description: input.description ?? null,
      instructions: input.instructions ?? null,
      visibility: input.visibility,
      status: 'draft',
      quizType: input.quizType,
      difficulty: input.difficulty,
      passingMarks: input.passingMarks,
      totalMarks: input.totalMarks,
      durationMinutes: input.durationMinutes ?? null,
      attemptLimit: input.attemptLimit,
      shuffleQuestions: input.shuffleQuestions,
      shuffleOptions: input.shuffleOptions,
      showResultsImmediately: input.showResultsImmediately,
      showCorrectAnswers: input.showCorrectAnswers,
      allowReview: input.allowReview,
      negativeMarking: input.negativeMarking,
      negativeMarkValue: input.negativeMarkValue,
      publishDate: parseDate(input.publishDate?.toISOString?.() ?? String(input.publishDate ?? '')),
      closeDate: parseDate(input.closeDate?.toISOString?.() ?? String(input.closeDate ?? '')),
      sectionIds: [],
      questionIds: (input.questionIds ?? []).map(oid),
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    const sectionIds = await this.createSectionsForQuiz(
      institutionId,
      doc._id,
      input.sections,
    );
    if (sectionIds.length > 0) {
      await quizRepository.updateQuizById(institutionId, String(doc._id), { sectionIds });
    }

    await this.audit('quiz.created', actor, institutionId, {
      quizId: String(doc._id),
      courseId: input.courseId,
    });

    eventBus.emit(EVENTS.QUIZ_CREATED, {
      quizId: String(doc._id),
      courseId: input.courseId,
      institutionId,
    });

    const refreshed = await quizRepository.findQuizById(institutionId, String(doc._id));
    return toDto(refreshed ?? doc);
  }

  async list(query: QuizListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let filter = quizRepository.buildQuizFilter(institutionId, query);
    filter = await this.scopeQuizFilter(filter, actor, institutionId);

    const result = await quizRepository.listQuizzes(filter, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async search(query: Partial<QuizListQuery>, actor: ActorContext) {
    return this.list(
      {
        ...query,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        sortBy: query.sortBy ?? 'createdAt',
        sortOrder: query.sortOrder ?? 'desc',
      } as QuizListQuery,
      actor,
    );
  }

  async get(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await quizRepository.findQuizById(institutionId, id);
    if (!doc) throw new NotFoundError('Quiz not found');

    await this.assertQuizReadAccess(doc, actor, institutionId);
    const sections = await quizRepository.listSectionsByQuiz(institutionId, id);
    return { ...toDto(doc), sections: sections.map(toDto) };
  }

  async update(id: string, input: UpdateQuizInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await quizRepository.findQuizById(institutionId, id);
    if (!existing) throw new NotFoundError('Quiz not found');
    await this.assertQuizWriteAccess(existing, actor, institutionId);

    const updates: Record<string, unknown> = { updatedBy: oid(actor.userId) };

    for (const key of [
      'title',
      'description',
      'instructions',
      'visibility',
      'quizType',
      'difficulty',
      'passingMarks',
      'totalMarks',
      'durationMinutes',
      'attemptLimit',
      'shuffleQuestions',
      'shuffleOptions',
      'showResultsImmediately',
      'showCorrectAnswers',
      'allowReview',
      'negativeMarking',
      'negativeMarkValue',
    ] as const) {
      if (input[key] !== undefined) updates[key] = input[key];
    }

    if (input.moduleId !== undefined) {
      updates.moduleId = input.moduleId ? oid(input.moduleId) : null;
    }
    if (input.lessonId !== undefined) {
      updates.lessonId = input.lessonId ? oid(input.lessonId) : null;
    }
    if (input.publishDate !== undefined) {
      updates.publishDate = input.publishDate
        ? parseDate(input.publishDate.toISOString?.() ?? String(input.publishDate))
        : null;
    }
    if (input.closeDate !== undefined) {
      updates.closeDate = input.closeDate
        ? parseDate(input.closeDate.toISOString?.() ?? String(input.closeDate))
        : null;
    }
    if (input.questionIds !== undefined) {
      updates.questionIds = input.questionIds.map(oid);
    }

    const totalMarks = (updates.totalMarks as number | undefined) ?? existing.totalMarks;
    const passingMarks = (updates.passingMarks as number | undefined) ?? existing.passingMarks;
    if (passingMarks > totalMarks) {
      throw new ValidationError('passingMarks cannot exceed totalMarks');
    }

    if (input.title && input.title !== existing.title) {
      updates.slug = await this.ensureQuizSlug(institutionId, input.title);
    }

    const doc = await quizRepository.updateQuizById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Quiz not found');

    if (input.sections !== undefined) {
      await quizRepository.softDeleteSectionsByQuiz(institutionId, id);
      const sectionIds = await this.createSectionsForQuiz(institutionId, doc._id, input.sections);
      await quizRepository.updateQuizById(institutionId, id, { sectionIds });
    }

    await this.audit('quiz.updated', actor, institutionId, {
      quizId: id,
      courseId: String(doc.courseId),
    });

    eventBus.emit(EVENTS.QUIZ_UPDATED, {
      quizId: id,
      courseId: String(doc.courseId),
      institutionId,
    });

    const refreshed = await quizRepository.findQuizById(institutionId, id);
    return toDto(refreshed ?? doc);
  }

  async remove(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await quizRepository.findQuizById(institutionId, id);
    if (!existing) throw new NotFoundError('Quiz not found');
    await this.assertQuizWriteAccess(existing, actor, institutionId);

    const doc = await quizRepository.softDeleteQuiz(institutionId, id);
    if (!doc) throw new NotFoundError('Quiz not found');

    await this.audit('quiz.deleted', actor, institutionId, {
      quizId: id,
      courseId: String(doc.courseId),
    });

    eventBus.emit(EVENTS.QUIZ_DELETED, {
      quizId: id,
      courseId: String(doc.courseId),
      institutionId,
    });

    return toDto(doc);
  }

  private async transition(id: string, to: QuizStatus, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await quizRepository.findQuizById(institutionId, id);
    if (!existing) throw new NotFoundError('Quiz not found');
    await this.assertQuizWriteAccess(existing, actor, institutionId);

    const from = existing.status as QuizStatus;
    if (!canTransitionStatus(from, to)) {
      throw new ConflictError(`Cannot change quiz status from ${from} to ${to}`);
    }

    const updates: Record<string, unknown> = { status: to, updatedBy: oid(actor.userId) };
    if (to === 'published' && !existing.publishDate) {
      updates.publishDate = new Date();
    }

    const doc = await quizRepository.updateQuizById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Quiz not found');

    const auditEvent =
      to === 'published'
        ? 'quiz.published'
        : to === 'archived'
          ? 'quiz.archived'
          : to === 'closed'
            ? 'quiz.closed'
            : 'quiz.updated';

    await this.audit(auditEvent, actor, institutionId, {
      quizId: id,
      courseId: String(doc.courseId),
      metadata: { from, to },
    });

    if (to === 'published') {
      eventBus.emit(EVENTS.QUIZ_PUBLISHED, {
        quizId: id,
        courseId: String(doc.courseId),
        institutionId,
      });
    } else {
      eventBus.emit(EVENTS.QUIZ_UPDATED, {
        quizId: id,
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

  async duplicate(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await quizRepository.findQuizById(institutionId, id);
    if (!existing) throw new NotFoundError('Quiz not found');
    await this.assertQuizWriteAccess(existing, actor, institutionId);

    const slug = await this.ensureQuizSlug(institutionId, `${existing.title} copy`);
    const doc = await quizRepository.createQuiz({
      institutionId: existing.institutionId,
      courseId: existing.courseId,
      moduleId: existing.moduleId,
      lessonId: existing.lessonId,
      title: `${existing.title} (Copy)`,
      slug,
      description: existing.description,
      instructions: existing.instructions,
      visibility: existing.visibility,
      status: 'draft',
      quizType: existing.quizType,
      difficulty: existing.difficulty,
      passingMarks: existing.passingMarks,
      totalMarks: existing.totalMarks,
      durationMinutes: existing.durationMinutes,
      attemptLimit: existing.attemptLimit,
      shuffleQuestions: existing.shuffleQuestions,
      shuffleOptions: existing.shuffleOptions,
      showResultsImmediately: existing.showResultsImmediately,
      showCorrectAnswers: existing.showCorrectAnswers,
      allowReview: existing.allowReview,
      negativeMarking: existing.negativeMarking,
      negativeMarkValue: existing.negativeMarkValue,
      publishDate: null,
      closeDate: existing.closeDate,
      sectionIds: [],
      questionIds: existing.questionIds,
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    const sections = await quizRepository.listSectionsByQuiz(institutionId, id);
    const sectionIds: Types.ObjectId[] = [];
    for (const section of sections) {
      const copy = await quizRepository.createSection({
        institutionId: section.institutionId,
        quizId: doc._id,
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
      await quizRepository.updateQuizById(institutionId, String(doc._id), { sectionIds });
    }

    await this.audit('quiz.created', actor, institutionId, {
      quizId: String(doc._id),
      courseId: String(doc.courseId),
      metadata: { sourceQuizId: id },
    });

    eventBus.emit(EVENTS.QUIZ_CREATED, {
      quizId: String(doc._id),
      courseId: String(doc.courseId),
      institutionId,
    });

    return toDto(doc);
  }

  // ------------------------------------------------------------- bulk operations

  async bulkAction(input: QuizBulkActionInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot perform bulk quiz actions');
    }

    const quizzes = await quizRepository.findQuizzesByIds(institutionId, input.ids);
    if (quizzes.length !== input.ids.length) {
      throw new NotFoundError('One or more quizzes not found');
    }

    for (const quiz of quizzes) {
      await this.assertQuizWriteAccess(quiz, actor, institutionId);
    }

    switch (input.action) {
      case 'publish': {
        const modified = await quizRepository.bulkUpdateQuizStatus(
          institutionId,
          input.ids,
          'published',
        );
        for (const quizId of input.ids) {
          eventBus.emit(EVENTS.QUIZ_PUBLISHED, { quizId, institutionId });
        }
        return { action: input.action, modified };
      }
      case 'archive': {
        const modified = await quizRepository.bulkUpdateQuizStatus(
          institutionId,
          input.ids,
          'archived',
        );
        return { action: input.action, modified };
      }
      case 'delete': {
        const modified = await quizRepository.bulkSoftDeleteQuizzes(institutionId, input.ids);
        for (const quizId of input.ids) {
          eventBus.emit(EVENTS.QUIZ_DELETED, { quizId, institutionId });
        }
        return { action: input.action, modified };
      }
      case 'duplicate': {
        const created: string[] = [];
        for (const quizId of input.ids) {
          const copy = await this.duplicate(quizId, actor);
          created.push(String(copy.id));
        }
        return { action: input.action, created, count: created.length };
      }
      case 'assign_faculty':
        throw new ValidationError('assign_faculty is not supported for quizzes');
      default:
        throw new ValidationError('Unsupported bulk action');
    }
  }

  // ------------------------------------------------------------- question banks

  async listQuestionBanks(
    query: { page?: number; limit?: number; q?: string; status?: string },
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    const filter = quizRepository.buildQuestionBankFilter(institutionId, query);
    const result = await quizRepository.listQuestionBanks(filter, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async getQuestionBank(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await quizRepository.findQuestionBankById(institutionId, id);
    if (!doc) throw new NotFoundError('Question bank not found');
    return toDto(doc);
  }

  async createQuestionBank(input: CreateQuestionBankInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot create question banks');
    }

    const slug = await ensureUniqueQuizSlug(
      institutionId,
      generateSlug(input.title),
      async (candidate) => {
        const existing = await quizRepository.findQuestionBankById(institutionId, candidate);
        return existing !== null;
      },
    );

    const doc = await quizRepository.createQuestionBank({
      institutionId: oid(institutionId),
      title: input.title,
      slug,
      description: input.description ?? null,
      status: 'active',
      questionCount: 0,
      categoryIds: (input.categoryIds ?? []).map(oid),
      tagIds: (input.tagIds ?? []).map(oid),
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    return toDto(doc);
  }

  async updateQuestionBank(id: string, input: UpdateQuestionBankInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot update question banks');
    }

    const existing = await quizRepository.findQuestionBankById(institutionId, id);
    if (!existing) throw new NotFoundError('Question bank not found');

    const updates: Record<string, unknown> = { updatedBy: oid(actor.userId) };
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.categoryIds !== undefined) updates.categoryIds = input.categoryIds.map(oid);
    if (input.tagIds !== undefined) updates.tagIds = input.tagIds.map(oid);

    const doc = await quizRepository.updateQuestionBankById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Question bank not found');
    return toDto(doc);
  }

  async archiveQuestionBank(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot archive question banks');
    }

    const doc = await quizRepository.updateQuestionBankById(institutionId, id, {
      status: 'archived',
      updatedBy: oid(actor.userId),
    });
    if (!doc) throw new NotFoundError('Question bank not found');
    return toDto(doc);
  }

  async duplicateQuestionBank(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await quizRepository.findQuestionBankById(institutionId, id);
    if (!existing) throw new NotFoundError('Question bank not found');

    const slug = await ensureUniqueQuizSlug(
      institutionId,
      generateSlug(`${existing.title}-copy`),
      async (candidate) => {
        const count = await QuestionBankModel.countDocuments({
          institutionId: oid(institutionId),
          slug: candidate,
          deletedAt: null,
        }).exec();
        return count > 0;
      },
    );

    const doc = await quizRepository.createQuestionBank({
      institutionId: existing.institutionId,
      title: `${existing.title} (Copy)`,
      slug,
      description: existing.description,
      status: 'active',
      questionCount: 0,
      categoryIds: existing.categoryIds,
      tagIds: existing.tagIds,
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    const questions = await quizRepository.listQuestions(
      { institutionId: oid(institutionId), questionBankId: oid(id), deletedAt: null },
      { page: 1, limit: 10000, sortBy: 'createdAt', sortOrder: 'asc' },
    );

    for (const question of questions.items) {
      await quizRepository.createQuestion({
        institutionId: question.institutionId,
        questionBankId: doc._id,
        question: question.question,
        description: question.description,
        questionType: question.questionType,
        difficulty: question.difficulty,
        marks: question.marks,
        negativeMarks: question.negativeMarks,
        explanation: question.explanation,
        hint: question.hint,
        tags: question.tags,
        category: question.category,
        attachments: question.attachments,
        options: question.options,
        matchPairs: question.matchPairs,
        fillBlankAnswers: question.fillBlankAnswers,
        createdBy: oid(actor.userId),
        updatedBy: oid(actor.userId),
      });
    }

    await quizRepository.updateQuestionBankById(institutionId, String(doc._id), {
      questionCount: questions.items.length,
    });

    return toDto(doc);
  }

  // ------------------------------------------------------------- questions

  async listQuestions(query: QuestionListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const filter = quizRepository.buildQuestionFilter(institutionId, query);
    const result = await quizRepository.listQuestions(filter, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async getQuestion(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const doc = await quizRepository.findQuestionById(institutionId, id);
    if (!doc) throw new NotFoundError('Question not found');
    return toDto(doc);
  }

  async createQuestion(input: CreateQuestionInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot create questions');
    }

    const bank = await quizRepository.findQuestionBankById(institutionId, input.questionBankId);
    if (!bank) throw new NotFoundError('Question bank not found');

    const doc = await quizRepository.createQuestion({
      institutionId: oid(institutionId),
      questionBankId: oid(input.questionBankId),
      question: input.question,
      description: input.description ?? null,
      questionType: input.questionType,
      difficulty: input.difficulty,
      marks: input.marks,
      negativeMarks: input.negativeMarks,
      explanation: input.explanation ?? null,
      hint: input.hint ?? null,
      tags: input.tags ?? [],
      category: input.category ?? null,
      attachments: [],
      options: this.mapQuestionOptions(input.options),
      matchPairs: this.mapMatchPairs(input.matchPairs),
      fillBlankAnswers: input.fillBlankAnswers ?? [],
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    await quizRepository.incrementQuestionBankCount(institutionId, input.questionBankId, 1);

    await this.audit('question.created', actor, institutionId, {
      questionId: String(doc._id),
    });

    eventBus.emit(EVENTS.QUESTION_CREATED, {
      questionId: String(doc._id),
      questionBankId: input.questionBankId,
      institutionId,
    });

    return toDto(doc);
  }

  async updateQuestion(id: string, input: UpdateQuestionInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot update questions');
    }

    const existing = await quizRepository.findQuestionById(institutionId, id);
    if (!existing) throw new NotFoundError('Question not found');

    const updates: Record<string, unknown> = { updatedBy: oid(actor.userId) };
    for (const key of [
      'question',
      'description',
      'questionType',
      'difficulty',
      'marks',
      'negativeMarks',
      'explanation',
      'hint',
      'tags',
      'category',
      'fillBlankAnswers',
    ] as const) {
      if (input[key] !== undefined) updates[key] = input[key];
    }
    if (input.options !== undefined) updates.options = this.mapQuestionOptions(input.options);
    if (input.matchPairs !== undefined) updates.matchPairs = this.mapMatchPairs(input.matchPairs);

    const doc = await quizRepository.updateQuestionById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Question not found');

    await this.audit('question.updated', actor, institutionId, { questionId: id });
    eventBus.emit(EVENTS.QUESTION_UPDATED, { questionId: id, institutionId });

    return toDto(doc);
  }

  async removeQuestion(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot delete questions');
    }

    const existing = await quizRepository.findQuestionById(institutionId, id);
    if (!existing) throw new NotFoundError('Question not found');

    const doc = await quizRepository.softDeleteQuestion(institutionId, id);
    if (!doc) throw new NotFoundError('Question not found');

    await quizRepository.incrementQuestionBankCount(
      institutionId,
      String(existing.questionBankId),
      -1,
    );

    await this.audit('question.deleted', actor, institutionId, { questionId: id });
    return toDto(doc);
  }

  async duplicateQuestion(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const existing = await quizRepository.findQuestionById(institutionId, id);
    if (!existing) throw new NotFoundError('Question not found');

    const doc = await quizRepository.createQuestion({
      institutionId: existing.institutionId,
      questionBankId: existing.questionBankId,
      question: `${existing.question} (Copy)`,
      description: existing.description,
      questionType: existing.questionType,
      difficulty: existing.difficulty,
      marks: existing.marks,
      negativeMarks: existing.negativeMarks,
      explanation: existing.explanation,
      hint: existing.hint,
      tags: existing.tags,
      category: existing.category,
      attachments: existing.attachments,
      options: existing.options,
      matchPairs: existing.matchPairs,
      fillBlankAnswers: existing.fillBlankAnswers,
      createdBy: oid(actor.userId),
      updatedBy: oid(actor.userId),
    });

    await quizRepository.incrementQuestionBankCount(
      institutionId,
      String(existing.questionBankId),
      1,
    );

    await this.audit('question.created', actor, institutionId, {
      questionId: String(doc._id),
      metadata: { sourceQuestionId: id },
    });

    return toDto(doc);
  }

  // ------------------------------------------------------------- categories / tags

  async listCategories(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const items = await quizRepository.listCategories(institutionId);
    return items.map(toDto);
  }

  async createCategory(
    input: { name: string; description?: string | null },
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot create categories');
    }

    const slug = generateSlug(input.name);
    const doc = await quizRepository.createCategory({
      institutionId: oid(institutionId),
      name: input.name,
      slug,
      description: input.description ?? null,
      questionCount: 0,
      createdBy: oid(actor.userId),
    });
    return toDto(doc);
  }

  async updateCategory(
    id: string,
    input: { name?: string; description?: string | null },
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot update categories');
    }

    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) {
      updates.name = input.name;
      updates.slug = generateSlug(input.name);
    }
    if (input.description !== undefined) updates.description = input.description;

    const doc = await quizRepository.updateCategoryById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Category not found');
    return toDto(doc);
  }

  async removeCategory(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot delete categories');
    }

    const doc = await quizRepository.softDeleteCategory(institutionId, id);
    if (!doc) throw new NotFoundError('Category not found');
    return toDto(doc);
  }

  async listTags(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const items = await quizRepository.listTags(institutionId);
    return items.map(toDto);
  }

  async createTag(input: { name: string }, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot create tags');
    }

    const doc = await quizRepository.createTag({
      institutionId: oid(institutionId),
      name: input.name,
      slug: generateSlug(input.name),
      questionCount: 0,
    });
    return toDto(doc);
  }

  async updateTag(id: string, input: { name?: string }, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot update tags');
    }

    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) {
      updates.name = input.name;
      updates.slug = generateSlug(input.name);
    }

    const doc = await quizRepository.updateTagById(institutionId, id, updates);
    if (!doc) throw new NotFoundError('Tag not found');
    return toDto(doc);
  }

  async removeTag(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot delete tags');
    }

    const doc = await quizRepository.softDeleteTag(institutionId, id);
    if (!doc) throw new NotFoundError('Tag not found');
    return toDto(doc);
  }

  // ------------------------------------------------------------- attempts

  async startAttempt(input: StartAttemptInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can start quiz attempts');
    }

    const quiz = await quizRepository.findQuizById(institutionId, input.quizId);
    if (!quiz) throw new NotFoundError('Quiz not found');

    if (quiz.status !== 'published') {
      throw new ConflictError('Quiz is not available for attempts');
    }

    if (isClosed(quiz.closeDate)) {
      throw new ConflictError('Quiz submission window has closed');
    }

    const student = await this.resolveStudent(actor, institutionId);
    await this.assertEnrollment(institutionId, student._id, quiz.courseId);

    const existingCount = await quizRepository.countStudentAttempts(input.quizId, String(student._id));
    if (!quizEngine.canStartAttempt(existingCount, quiz.attemptLimit)) {
      throw new ConflictError('Maximum attempt limit reached');
    }

    const attemptNumber = quizEngine.nextAttemptNumber(existingCount);
    const startedAt = new Date();

    const attempt = await quizRepository.createAttempt({
      institutionId: oid(institutionId),
      quizId: quiz._id,
      studentId: student._id,
      courseId: quiz.courseId,
      attemptNumber,
      startedAt,
      status: 'started',
      score: 0,
      percentage: 0,
      timeTakenSeconds: 0,
      autoSubmitted: false,
    });

    const questionIds = quiz.questionIds.map(String);
    const sections = await quizRepository.listSectionsByQuiz(institutionId, input.quizId);
    for (const section of sections) {
      for (const qid of section.questionIds) {
        if (!questionIds.includes(String(qid))) {
          questionIds.push(String(qid));
        }
      }
    }

    const selectedIds = quizEngine.selectQuestionsForQuiz(
      questionIds,
      sections.map((s) => ({
        questionIds: s.questionIds.map(String),
        randomizeQuestions: s.randomizeQuestions,
        randomQuestionCount: s.randomQuestionCount ?? null,
      })),
      quiz.shuffleQuestions,
    );
    const questions = await quizRepository.findQuestionsByIds(institutionId, selectedIds);
    const rendered = questions.map((q) =>
      quizEngine.renderQuestionForAttempt(q, {
        shuffleOptions: quiz.shuffleOptions,
        hideCorrectAnswers: true,
      }),
    );

    await this.audit('attempt.started', actor, institutionId, {
      quizId: input.quizId,
      attemptId: String(attempt._id),
      courseId: String(quiz.courseId),
      metadata: { attemptNumber },
    });

    eventBus.emit(EVENTS.ATTEMPT_STARTED, {
      attemptId: String(attempt._id),
      quizId: input.quizId,
      studentId: String(student._id),
      institutionId,
    });

    eventBus.emit(EVENTS.QUIZ_STARTED, {
      quizId: input.quizId,
      attemptId: String(attempt._id),
      institutionId,
    });

    return {
      attempt: toDto(attempt),
      questions: rendered,
      remainingSeconds: quizEngine.remainingSeconds(
        {
          quizId: input.quizId,
          attemptId: String(attempt._id),
          studentId: String(student._id),
          startedAt,
          durationMinutes: quiz.durationMinutes ?? null,
        },
        startedAt,
      ),
    };
  }

  async saveAnswer(attemptId: string, input: SubmitAnswerInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can save answers');
    }

    const attempt = await quizRepository.findAttemptById(institutionId, attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');

    const student = await this.resolveStudent(actor, institutionId);
    if (String(attempt.studentId) !== String(student._id)) {
      throw new ForbiddenError('Can only save answers for your own attempt');
    }

    if (attempt.status !== 'started') {
      throw new ConflictError('Attempt is no longer active');
    }

    const quiz = await quizRepository.findQuizById(institutionId, String(attempt.quizId));
    if (!quiz) throw new NotFoundError('Quiz not found');

    const expired = quizEngine.isAttemptExpired(
      {
        quizId: String(quiz._id),
        attemptId,
        studentId: String(student._id),
        startedAt: attempt.startedAt,
        durationMinutes: quiz.durationMinutes ?? null,
      },
      new Date(),
    );
    if (expired) {
      throw new ConflictError('Attempt has expired');
    }

    const question = await quizRepository.findQuestionById(institutionId, input.questionId);
    if (!question) throw new NotFoundError('Question not found');

    const evaluated = quizEngine.evaluateAnswer(
      {
        id: String(question._id),
        questionType: question.questionType,
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
      },
      {
        questionId: input.questionId,
        selectedOptionIds: input.selectedOptionIds ?? [],
        textAnswer: input.textAnswer ?? null,
        matchAnswers: input.matchAnswers ?? {},
      },
      quiz.negativeMarking,
    );

    const answer = await quizRepository.upsertAnswer(
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

    eventBus.emit(EVENTS.QUESTION_ANSWERED, {
      attemptId,
      questionId: input.questionId,
      institutionId,
    });

    return toDto(answer);
  }

  async submitQuiz(input: SubmitQuizInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role !== 'student') {
      throw new ForbiddenError('Only students can submit quizzes');
    }

    const attempt = await quizRepository.findAttemptById(institutionId, input.attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');

    const student = await this.resolveStudent(actor, institutionId);
    if (String(attempt.studentId) !== String(student._id)) {
      throw new ForbiddenError('Can only submit your own attempt');
    }

    if (attempt.status !== 'started') {
      throw new ConflictError('Attempt has already been submitted');
    }

    const quiz = await quizRepository.findQuizById(institutionId, String(attempt.quizId));
    if (!quiz) throw new NotFoundError('Quiz not found');

    for (const answerInput of input.answers ?? []) {
      await this.saveAnswer(input.attemptId, answerInput, actor);
    }

    const savedAnswers = await quizRepository.listAnswersByAttempt(input.attemptId);
    const questionIds = [...new Set(savedAnswers.map((a) => String(a.questionId)))];
    const questions = await quizRepository.findQuestionsByIds(institutionId, questionIds);

    const evaluable = questions.map((q) => ({
      id: String(q._id),
      questionType: q.questionType,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      options: (q.options ?? []).map((o) => ({ id: o.id, isCorrect: o.isCorrect })),
      matchPairs: (q.matchPairs ?? []).map((p) => ({
        id: p.id,
        left: p.left,
        right: p.right,
      })),
      fillBlankAnswers: q.fillBlankAnswers ?? [],
    }));

    const answerInputs = savedAnswers.map((a) => ({
      questionId: String(a.questionId),
      selectedOptionIds: a.selectedOptionIds ?? [],
      textAnswer: a.textAnswer ?? null,
      matchAnswers: (a.matchAnswers as Record<string, string>) ?? {},
    }));

    const result = quizEngine.evaluateAttempt(evaluable, answerInputs, {
      passingMarks: quiz.passingMarks,
      totalMarks: quiz.totalMarks,
      negativeMarking: quiz.negativeMarking,
    });

    const submittedAt = new Date();
    const timeTakenSeconds = quizEngine.computeTimeTakenSeconds(attempt.startedAt, submittedAt);

    const updatedAttempt = await quizRepository.updateAttemptById(
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

    const quizResult = await quizRepository.createResult({
      institutionId: oid(institutionId),
      attemptId: oid(input.attemptId),
      quizId: quiz._id,
      studentId: student._id,
      totalQuestions: result.evaluated.length,
      correct: result.correct,
      incorrect: result.incorrect,
      skipped: result.skipped,
      score: result.score,
      percentage: result.percentage,
      passed: result.passed,
      rank: null,
    });

    await this.audit('attempt.submitted', actor, institutionId, {
      quizId: String(quiz._id),
      attemptId: input.attemptId,
      courseId: String(quiz.courseId),
      metadata: { score: result.score, passed: result.passed },
    });

    await this.audit('attempt.completed', actor, institutionId, {
      quizId: String(quiz._id),
      attemptId: input.attemptId,
      courseId: String(quiz.courseId),
    });

    eventBus.emit(EVENTS.ATTEMPT_SUBMITTED, {
      attemptId: input.attemptId,
      quizId: String(quiz._id),
      studentId: String(student._id),
      institutionId,
    });

    eventBus.emit(EVENTS.QUIZ_COMPLETED, {
      quizId: String(quiz._id),
      attemptId: input.attemptId,
      institutionId,
    });

    const response: Record<string, unknown> = {
      attempt: toDto(updatedAttempt!),
      result: toDto(quizResult),
    };

    if (quiz.showResultsImmediately) {
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
    const attempt = await quizRepository.findAttemptById(institutionId, id);
    if (!attempt) throw new NotFoundError('Attempt not found');

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      if (String(attempt.studentId) !== String(student._id)) {
        throw new ForbiddenError('Access denied');
      }
    }

    const result = await quizRepository.findResultByAttempt(id);
    const answers = await quizRepository.listAnswersByAttempt(id);

    return {
      attempt: toDto(attempt),
      result: result ? toDto(result) : null,
      answers: answers.map(toDto),
    };
  }

  async listAttempts(
    query: { quizId?: string; studentId?: string; page?: number; limit?: number },
    actor: ActorContext,
  ) {
    const institutionId = requireTenant(actor);
    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };

    if (query.quizId) filter.quizId = oid(query.quizId);
    if (query.studentId) filter.studentId = oid(query.studentId);

    if (actor.role === 'student') {
      const student = await this.resolveStudent(actor, institutionId);
      filter.studentId = student._id;
    }

    const result = await quizRepository.listAttempts(filter, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  // ------------------------------------------------------------- analytics / dashboards

  async getAnalytics(quizId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const quiz = await quizRepository.findQuizById(institutionId, quizId);
    if (!quiz) throw new NotFoundError('Quiz not found');
    await this.assertQuizReadAccess(quiz, actor, institutionId);

    const analytics = await quizRepository.getQuizAnalytics(institutionId, quizId);
    const mostIncorrect = rankMostIncorrectQuestions(analytics.questionStats, 5).map((q) => ({
      questionId: q.questionId,
      title: q.title,
      incorrectRate: q.incorrectRate,
    }));

    return {
      quizId,
      ...analytics,
      mostIncorrect,
    };
  }

  async getStats(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) {
      throw new ForbiddenError('Institution admin access required');
    }
    return quizRepository.getStats(institutionId);
  }

  async listAudit(actor: ActorContext, quizId?: string) {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) {
      throw new ForbiddenError('Institution admin access required');
    }
    const logs = await quizRepository.listAudit(institutionId, quizId);
    return logs.map(toDto);
  }

  async getFacultyDashboard(actor: ActorContext): Promise<QuizFacultyDashboard> {
    const institutionId = requireTenant(actor);
    const institutionOid = oid(institutionId);
    const courseIds = await this.facultyCourseIds(actor, institutionId);

    const ownership = {
      $or: [{ createdBy: oid(actor.userId) }, { courseId: { $in: courseIds } }],
    };

    const quizzes = await QuizModel.find({
      institutionId: institutionOid,
      deletedAt: null,
      ...ownership,
    })
      .select('_id status')
      .exec();

    const quizIds = quizzes.map((q) => q._id);
    const attemptBase = {
      institutionId: institutionOid,
      quizId: { $in: quizIds },
      status: { $in: ['submitted', 'completed'] },
    };

    const [quizzesCreated, publishedQuizzes, totalAttempts, averageScore] = await Promise.all([
      QuizModel.countDocuments({
        institutionId: institutionOid,
        deletedAt: null,
        createdBy: oid(actor.userId),
      }),
      quizzes.filter((q) => q.status === 'published').length,
      quizRepository.countAttempts(attemptBase),
      quizRepository.averageAttemptScore(attemptBase),
    ]);

    const completionRate =
      quizzes.length > 0 ? Math.round((publishedQuizzes / quizzes.length) * 10000) / 100 : 0;

    return {
      quizzesCreated,
      publishedQuizzes,
      totalAttempts,
      averageScore: averageScore ?? 0,
      completionRate,
      mostMissedQuestions: [],
    };
  }

  async getStudentDashboard(actor: ActorContext): Promise<QuizStudentDashboard> {
    const institutionId = requireTenant(actor);
    const student = await this.resolveStudent(actor, institutionId);
    const courseIds = await this.enrolledCourseIds(student._id, institutionId);

    const [upcomingQuizzes, completedQuizzes, pendingQuizzes, averageScore, recentAttempts] =
      await Promise.all([
        QuizModel.countDocuments({
          institutionId: oid(institutionId),
          deletedAt: null,
          courseId: { $in: courseIds },
          status: 'published',
          closeDate: { $gte: new Date() },
        }),
        QuizAttemptModel.countDocuments({
          institutionId: oid(institutionId),
          studentId: student._id,
          status: 'completed',
        }),
        QuizModel.countDocuments({
          institutionId: oid(institutionId),
          deletedAt: null,
          courseId: { $in: courseIds },
          status: 'published',
        }),
        quizRepository.averageAttemptScore({
          institutionId: oid(institutionId),
          studentId: student._id,
          status: { $in: ['submitted', 'completed'] },
        }),
        QuizAttemptModel.find({
          institutionId: oid(institutionId),
          studentId: student._id,
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .exec(),
      ]);

    return {
      upcomingQuizzes,
      completedQuizzes,
      pendingQuizzes: Math.max(0, pendingQuizzes - completedQuizzes),
      averageScore: averageScore ?? 0,
      recentAttempts: recentAttempts.map(toDto) as unknown as QuizStudentDashboard['recentAttempts'],
    };
  }

  async getInstitutionDashboard(actor: ActorContext): Promise<QuizInstitutionDashboard> {
    const institutionId = requireTenant(actor);
    if (!canManage(actor)) {
      throw new ForbiddenError('Institution admin access required');
    }

    const stats = await quizRepository.getStats(institutionId);

    return {
      totalQuizzes: stats.total,
      questionBankSize: stats.questionBankSize,
      totalAttempts: stats.totalAttempts,
      averageScore: stats.averageScore ?? 0,
      passRate: stats.passRate ?? 0,
      departmentComparison: [],
    };
  }

  // ------------------------------------------------------------- import / export

  async previewImport(quizzes: CreateQuizInput[], actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot import quizzes');
    }

    const importId = randomUUID();
    pendingImports.set(importId, {
      institutionId,
      userId: actor.userId,
      quizzes,
      createdAt: new Date(),
    });

    return {
      importId,
      count: quizzes.length,
      expiresInSeconds: 3600,
    };
  }

  async confirmImport(input: QuizImportConfirmInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Students cannot import quizzes');
    }

    const pending = pendingImports.get(input.importId);
    if (!pending) {
      throw new NotFoundError('Import session not found or expired');
    }
    if (pending.institutionId !== institutionId || pending.userId !== actor.userId) {
      throw new ForbiddenError('Import session access denied');
    }

    const quizIds: string[] = [];
    const errors: { index: number; message: string }[] = [];

    for (let i = 0; i < pending.quizzes.length; i++) {
      const row = pending.quizzes[i];
      if (!row) continue;
      try {
        const created = await this.create(row, actor);
        quizIds.push(String(created.id));
      } catch (error) {
        logger.warn({ error, index: i }, 'Quiz import row failed');
        errors.push({
          index: i,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    pendingImports.delete(input.importId);

    return {
      imported: quizIds.length,
      failed: errors.length,
      errors,
      quizIds,
    };
  }

  async export(query: QuizExportQuery, actor: ActorContext) {
    requireTenant(actor);

    const listQuery = {
      courseId: query.courseId,
      status: query.status,
      page: 1,
      limit: 10000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    } as QuizListQuery;

    const result = await this.list(listQuery, actor);
    const rows = result.items.map((item) =>
      Object.fromEntries(QUIZ_CSV_HEADERS.map((h) => [h, item[h]])),
    );

    if (query.format === 'csv') {
      return { data: rowsToCsv(rows), format: 'csv' as const, count: rows.length };
    }

    return { data: result.items, format: 'json' as const, count: result.items.length };
  }
}

export const quizService = new QuizService();
