import { Types } from 'mongoose';
import { EVENTS } from '@learnova/events';
import type {
  OpenLessonInput,
  CompleteLessonInput,
  UpdateLessonProgressInput,
  ResourceProgressUpdateInput,
  CreateBookmarkInput,
  CreateNoteInput,
  UpdateNoteInput,
  ProgressListQuery,
  BookmarkListQuery,
  NoteListQuery,
  ActivityListQuery,
} from '@learnova/validation';
import { eventBus } from '../../events/index.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { StudentModel } from '../../models/student.model.js';
import { FacultyModel } from '../../models/faculty.model.js';
import { CourseModel } from '../../models/course.model.js';
import { CourseModuleModel } from '../../models/course-module.model.js';
import { CourseLessonModel } from '../../models/course-lesson.model.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { progressRepository } from '../../repositories/progress/index.js';
import {
  clampPercent,
  computeCompletionPercentage,
  deriveLearningStatus,
  estimateRemainingMinutes,
  isLessonComplete,
  secondsToMinutes,
} from './progress.helpers.js';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

type StartSessionInput = {
  courseId: string;
  lessonId?: string;
};

type EndSessionInput = {
  sessionId: string;
  idleSeconds: number;
  activeSeconds?: number;
};

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

  const normalize = (value: unknown): unknown => {
    if (value instanceof Types.ObjectId) return String(value);
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (k === '_id') {
          out.id = String(v);
        } else {
          out[k] = normalize(v);
        }
      }
      return out;
    }
    return value;
  };

  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    normalized[key] = normalize(value);
  }

  return {
    id: String(_id),
    ...normalized,
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

function escapeCsv(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export class ProgressService {
  private async resolveStudentId(
    actor: ActorContext,
    institutionId: string,
    explicitStudentId?: string,
  ): Promise<string> {
    if (actor.role === 'student') {
      const student = await StudentModel.findOne({
        institutionId: new Types.ObjectId(institutionId),
        email: actor.email.toLowerCase(),
        deletedAt: null,
      }).exec();
      if (!student) throw new NotFoundError('Student record not found');
      return String(student._id);
    }

    if (explicitStudentId) {
      const student = await StudentModel.findOne({
        _id: explicitStudentId,
        institutionId: new Types.ObjectId(institutionId),
        deletedAt: null,
      }).exec();
      if (!student) throw new NotFoundError('Student not found');
      return String(student._id);
    }

    throw new ForbiddenError('Student context required');
  }

  private async requireActiveEnrollment(
    institutionId: string,
    studentId: string,
    courseId: string,
  ) {
    const enrollment = await EnrollmentModel.findOne({
      institutionId: new Types.ObjectId(institutionId),
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      deletedAt: null,
      status: { $in: ['active', 'approved'] },
    }).exec();

    if (!enrollment) {
      throw new ForbiddenError('Active enrollment required');
    }

    return enrollment;
  }

  private async ensureFacultyCourseAccess(
    actor: ActorContext,
    institutionId: string,
    courseId: string,
  ) {
    if (actor.role !== 'faculty') return;

    const faculty = await FacultyModel.findOne({
      institutionId: new Types.ObjectId(institutionId),
      email: actor.email.toLowerCase(),
      deletedAt: null,
    }).exec();
    if (!faculty) throw new ForbiddenError('Faculty record not found');

    const course = await CourseModel.findOne({
      _id: courseId,
      institutionId: new Types.ObjectId(institutionId),
      deletedAt: null,
      $or: [{ facultyIds: faculty._id }, { coordinatorId: faculty._id }],
    }).exec();
    if (!course) throw new ForbiddenError('Access denied');
  }

  private async audit(
    event: Parameters<typeof progressRepository.logAudit>[0]['event'],
    actor: ActorContext,
    institutionId: string,
    opts: {
      studentId?: string | null;
      courseId?: string | null;
      moduleId?: string | null;
      lessonId?: string | null;
      resourceId?: string | null;
      enrollmentId?: string | null;
      metadata?: Record<string, unknown>;
    } = {},
  ) {
    await progressRepository.logAudit({
      event,
      institutionId,
      studentId: opts.studentId,
      courseId: opts.courseId,
      moduleId: opts.moduleId,
      lessonId: opts.lessonId,
      resourceId: opts.resourceId,
      enrollmentId: opts.enrollmentId,
      userId: actor.userId,
      email: actor.email,
      metadata: opts.metadata,
    });
  }

  private async ensureCourseProgress(
    institutionId: string,
    studentId: string,
    courseId: string,
    enrollmentId: string,
  ) {
    const existing = await progressRepository.findCourseProgress(
      institutionId,
      studentId,
      courseId,
    );
    if (existing) return existing;

    return progressRepository.createCourseProgress({
      institutionId: new Types.ObjectId(institutionId),
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      enrollmentId: new Types.ObjectId(enrollmentId),
      progressPercentage: 0,
      status: 'not_started',
      startedAt: null,
      lastAccessedAt: null,
      completedAt: null,
      estimatedRemainingMinutes: 0,
      timeSpentMinutes: 0,
      currentModuleId: null,
      currentLessonId: null,
      bookmarksCount: 0,
      notesCount: 0,
    });
  }

  private async rollupProgress(
    actor: ActorContext,
    institutionId: string,
    studentId: string,
    courseId: string,
    opts: {
      enrollmentId: string;
      currentModuleId?: string | null;
      currentLessonId?: string | null;
      resumePosition?: Record<string, unknown>;
      extraTimeMinutes?: number;
      lessonJustCompleted?: { moduleId: string; lessonId: string };
    },
  ) {
    const publishedModules = await CourseModuleModel.find({
      institutionId: new Types.ObjectId(institutionId),
      courseId: new Types.ObjectId(courseId),
      status: 'published',
      deletedAt: null,
    })
      .select('_id estimatedMinutes')
      .exec();

    const publishedLessons = await CourseLessonModel.find({
      institutionId: new Types.ObjectId(institutionId),
      courseId: new Types.ObjectId(courseId),
      status: 'published',
      deletedAt: null,
    })
      .select('_id moduleId estimatedMinutes')
      .exec();

    const lessonProgress = await progressRepository.listLessonProgress(
      institutionId,
      studentId,
      courseId,
    );
    const completedLessonIds = new Set(
      lessonProgress.filter((l) => l.completed).map((l) => String(l.lessonId)),
    );

    let modulesJustCompleted: string[] = [];
    let courseJustCompleted = false;

    for (const mod of publishedModules) {
      const moduleId = String(mod._id);
      const moduleLessons = publishedLessons.filter((l) => String(l.moduleId) === moduleId);
      const completedInModule = moduleLessons.filter((l) =>
        completedLessonIds.has(String(l._id)),
      ).length;
      const totalInModule = moduleLessons.length;
      const completionPercentage = computeCompletionPercentage(completedInModule, totalInModule);
      const status = deriveLearningStatus({
        completedCount: completedInModule,
        totalCount: totalInModule,
        previouslyStarted: completedInModule > 0 || lessonProgress.some(
          (lp) => String(lp.moduleId) === moduleId && lp.visitCount > 0,
        ),
      });

      const existing = await progressRepository.findModuleProgress(
        institutionId,
        studentId,
        moduleId,
      );
      const wasCompleted = existing?.status === 'completed';

      const moduleDoc = await progressRepository.upsertModuleProgress(
        { institutionId, studentId, moduleId },
        {
          institutionId: new Types.ObjectId(institutionId),
          studentId: new Types.ObjectId(studentId),
          moduleId: new Types.ObjectId(moduleId),
          courseId: new Types.ObjectId(courseId),
          completionPercentage,
          status,
          startedAt: existing?.startedAt ?? (status !== 'not_started' ? new Date() : null),
          completedAt: status === 'completed' ? (existing?.completedAt ?? new Date()) : null,
          lastAccessedAt: new Date(),
        },
      );

      if (status === 'completed' && !wasCompleted) {
        modulesJustCompleted.push(moduleId);
        await progressRepository.createActivity({
          institutionId,
          studentId,
          courseId,
          moduleId,
          type: 'module_completed',
        });
        await this.audit('module_completed', actor, institutionId, {
          studentId,
          courseId,
          moduleId,
          enrollmentId: opts.enrollmentId,
        });
        eventBus.emit(EVENTS.MODULE_COMPLETED, {
          courseId,
          moduleId,
          studentId,
          institutionId,
        });
      }

      void moduleDoc;
    }

    const totalLessons = publishedLessons.length;
    const completedLessons = publishedLessons.filter((l) =>
      completedLessonIds.has(String(l._id)),
    ).length;
    const totalModules = publishedModules.length;
    const completedModules = (
      await progressRepository.listModuleProgress(institutionId, studentId, courseId)
    ).filter((m) => m.status === 'completed').length;

    // Prefer lesson-based % when lessons exist; else module-based
    const progressPercentage =
      totalLessons > 0
        ? computeCompletionPercentage(completedLessons, totalLessons)
        : computeCompletionPercentage(completedModules, totalModules);

    const courseStatus = deriveLearningStatus({
      completedCount: totalLessons > 0 ? completedLessons : completedModules,
      totalCount: totalLessons > 0 ? totalLessons : totalModules,
      previouslyStarted: true,
    });

    const totalEstimated = publishedLessons.reduce(
      (sum, l) => sum + (l.estimatedMinutes ?? 0),
      0,
    ) || publishedModules.reduce((sum, m) => sum + (m.estimatedMinutes ?? 0), 0);

    const existingCourse = await progressRepository.findCourseProgress(
      institutionId,
      studentId,
      courseId,
    );
    const wasCourseCompleted = existingCourse?.status === 'completed';

    const timeSpentMinutes =
      (existingCourse?.timeSpentMinutes ?? 0) + (opts.extraTimeMinutes ?? 0);

    const courseDoc = await progressRepository.upsertCourseProgress(
      { institutionId, studentId, courseId },
      {
        institutionId: new Types.ObjectId(institutionId),
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
        enrollmentId: new Types.ObjectId(opts.enrollmentId),
        progressPercentage,
        status: courseStatus,
        startedAt: existingCourse?.startedAt ?? new Date(),
        lastAccessedAt: new Date(),
        completedAt:
          courseStatus === 'completed'
            ? (existingCourse?.completedAt ?? new Date())
            : null,
        estimatedRemainingMinutes: estimateRemainingMinutes(totalEstimated, progressPercentage),
        timeSpentMinutes,
        currentModuleId: opts.currentModuleId
          ? new Types.ObjectId(opts.currentModuleId)
          : (existingCourse?.currentModuleId ?? null),
        currentLessonId: opts.currentLessonId
          ? new Types.ObjectId(opts.currentLessonId)
          : (existingCourse?.currentLessonId ?? null),
        ...(opts.resumePosition
          ? {
              resumePosition: {
                scrollY: opts.resumePosition.scrollY ?? null,
                videoSeconds: opts.resumePosition.videoSeconds ?? null,
                markdownOffset: opts.resumePosition.markdownOffset ?? null,
                lastResourceId: opts.resumePosition.lastResourceId
                  ? new Types.ObjectId(String(opts.resumePosition.lastResourceId))
                  : null,
              },
            }
          : {}),
        bookmarksCount: existingCourse?.bookmarksCount ?? 0,
        notesCount: existingCourse?.notesCount ?? 0,
      },
    );

    await this.audit('progress_updated', actor, institutionId, {
      studentId,
      courseId,
      enrollmentId: opts.enrollmentId,
      metadata: { progressPercentage, status: courseStatus },
    });

    eventBus.emit(EVENTS.PROGRESS_UPDATED, {
      courseId,
      studentId,
      institutionId,
      progressPercentage,
    });

    eventBus.emit(EVENTS.COURSE_PROGRESS_UPDATED, {
      courseId,
      studentId,
      progressPercent: progressPercentage,
    });

    if (courseStatus === 'completed' && !wasCourseCompleted) {
      courseJustCompleted = true;
      await progressRepository.createActivity({
        institutionId,
        studentId,
        courseId,
        type: 'course_completed',
      });
      await this.audit('course_completed', actor, institutionId, {
        studentId,
        courseId,
        enrollmentId: opts.enrollmentId,
      });
      eventBus.emit(EVENTS.COURSE_COMPLETED, {
        courseId,
        studentId,
        institutionId,
        enrollmentId: opts.enrollmentId,
      });

      await EnrollmentModel.findOneAndUpdate(
        {
          _id: opts.enrollmentId,
          institutionId: new Types.ObjectId(institutionId),
        },
        {
          $set: {
            completionStatus: 'completed',
            status: 'completed',
            completionDate: new Date(),
          },
        },
      ).exec();
    } else if (courseStatus === 'in_progress' && existingCourse?.status === 'not_started') {
      await EnrollmentModel.findOneAndUpdate(
        {
          _id: opts.enrollmentId,
          institutionId: new Types.ObjectId(institutionId),
        },
        { $set: { completionStatus: 'in_progress' } },
      ).exec();
    }

    return {
      course: courseDoc,
      modulesJustCompleted,
      courseJustCompleted,
    };
  }

  async listMine(query: ProgressListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId, query.studentId);
    const result = await progressRepository.listCourseProgress(institutionId, studentId, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async getCourseDetail(courseId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    await this.requireActiveEnrollment(institutionId, studentId, courseId);

    let courseProgress = await progressRepository.findCourseProgress(
      institutionId,
      studentId,
      courseId,
    );
    if (!courseProgress) {
      const enrollment = await this.requireActiveEnrollment(institutionId, studentId, courseId);
      courseProgress = await this.ensureCourseProgress(
        institutionId,
        studentId,
        courseId,
        String(enrollment._id),
      );
    }

    const [modules, lessons, moduleProgress, lessonProgress] = await Promise.all([
      CourseModuleModel.find({
        institutionId: new Types.ObjectId(institutionId),
        courseId: new Types.ObjectId(courseId),
        status: 'published',
        deletedAt: null,
      })
        .sort({ orderIndex: 1 })
        .exec(),
      CourseLessonModel.find({
        institutionId: new Types.ObjectId(institutionId),
        courseId: new Types.ObjectId(courseId),
        status: 'published',
        deletedAt: null,
      })
        .sort({ orderIndex: 1 })
        .exec(),
      progressRepository.listModuleProgress(institutionId, studentId, courseId),
      progressRepository.listLessonProgress(institutionId, studentId, courseId),
    ]);

    const moduleProgressById = new Map(moduleProgress.map((m) => [String(m.moduleId), m]));
    const lessonProgressById = new Map(lessonProgress.map((l) => [String(l.lessonId), l]));

    return {
      course: toDto(courseProgress),
      modules: modules.map((m) => {
        const mp = moduleProgressById.get(String(m._id));
        return {
          id: String(m._id),
          title: m.title,
          orderIndex: m.orderIndex,
          estimatedMinutes: m.estimatedMinutes,
          progress: mp ? toDto(mp) : null,
          lessons: lessons
            .filter((l) => String(l.moduleId) === String(m._id))
            .map((l) => {
              const lp = lessonProgressById.get(String(l._id));
              return {
                id: String(l._id),
                title: l.title,
                orderIndex: l.orderIndex,
                lessonType: l.lessonType,
                estimatedMinutes: l.estimatedMinutes,
                progress: lp ? toDto(lp) : null,
              };
            }),
        };
      }),
    };
  }

  async getResume(courseId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    await this.requireActiveEnrollment(institutionId, studentId, courseId);

    const progress = await progressRepository.findCourseProgress(
      institutionId,
      studentId,
      courseId,
    );
    if (!progress) {
      return {
        courseId,
        currentModuleId: null,
        currentLessonId: null,
        resumePosition: {
          scrollY: null,
          videoSeconds: null,
          markdownOffset: null,
          lastResourceId: null,
        },
        progressPercentage: 0,
        status: 'not_started',
      };
    }

    return {
      courseId,
      currentModuleId: progress.currentModuleId ? String(progress.currentModuleId) : null,
      currentLessonId: progress.currentLessonId ? String(progress.currentLessonId) : null,
      resumePosition: {
        scrollY: progress.resumePosition?.scrollY ?? null,
        videoSeconds: progress.resumePosition?.videoSeconds ?? null,
        markdownOffset: progress.resumePosition?.markdownOffset ?? null,
        lastResourceId: progress.resumePosition?.lastResourceId
          ? String(progress.resumePosition.lastResourceId)
          : null,
      },
      progressPercentage: progress.progressPercentage,
      status: progress.status,
      lastAccessedAt: progress.lastAccessedAt
        ? new Date(progress.lastAccessedAt).toISOString()
        : null,
    };
  }

  async openLesson(input: OpenLessonInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    const enrollment = await this.requireActiveEnrollment(
      institutionId,
      studentId,
      input.courseId,
    );

    const existing = await progressRepository.findLessonProgress(studentId, input.lessonId);
    const now = new Date();

    const lesson = await progressRepository.upsertLessonProgress(
      { studentId, lessonId: input.lessonId },
      {
        institutionId: new Types.ObjectId(institutionId),
        studentId: new Types.ObjectId(studentId),
        lessonId: new Types.ObjectId(input.lessonId),
        moduleId: new Types.ObjectId(input.moduleId),
        courseId: new Types.ObjectId(input.courseId),
        status: existing?.completed
          ? 'completed'
          : existing
            ? 'in_progress'
            : 'in_progress',
        lastPosition: input.position ?? existing?.lastPosition ?? 0,
        lastAccessedAt: now,
        visitCount: (existing?.visitCount ?? 0) + 1,
        watchPercentage: existing?.watchPercentage ?? 0,
        readingPercentage: existing?.readingPercentage ?? 0,
        timeSpentSeconds: existing?.timeSpentSeconds ?? 0,
        completed: existing?.completed ?? false,
        completedAt: existing?.completedAt ?? null,
      },
    );

    await this.ensureCourseProgress(
      institutionId,
      studentId,
      input.courseId,
      String(enrollment._id),
    );

    const courseExisting = await progressRepository.findCourseProgress(
      institutionId,
      studentId,
      input.courseId,
    );
    if (courseExisting?.status === 'not_started') {
      await progressRepository.createActivity({
        institutionId,
        studentId,
        courseId: input.courseId,
        type: 'course_started',
      });
    }

    await progressRepository.createActivity({
      institutionId,
      studentId,
      courseId: input.courseId,
      moduleId: input.moduleId,
      lessonId: input.lessonId,
      type: 'lesson_opened',
    });

    await this.audit('lesson_opened', actor, institutionId, {
      studentId,
      courseId: input.courseId,
      moduleId: input.moduleId,
      lessonId: input.lessonId,
      enrollmentId: String(enrollment._id),
    });

    await this.rollupProgress(actor, institutionId, studentId, input.courseId, {
      enrollmentId: String(enrollment._id),
      currentModuleId: input.moduleId,
      currentLessonId: input.lessonId,
      resumePosition: input.position != null ? { scrollY: input.position } : undefined,
    });

    return toDto(lesson);
  }

  async completeLesson(input: CompleteLessonInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    const enrollment = await this.requireActiveEnrollment(
      institutionId,
      studentId,
      input.courseId,
    );

    const existing = await progressRepository.findLessonProgress(studentId, input.lessonId);
    const watchPercentage = clampPercent(
      input.watchPercentage ?? existing?.watchPercentage ?? 100,
    );
    const readingPercentage = clampPercent(
      input.readingPercentage ?? existing?.readingPercentage ?? 100,
    );
    const completed = isLessonComplete({
      watchPercentage,
      readingPercentage,
      manuallyCompleted: true,
    });
    const now = new Date();

    const lesson = await progressRepository.upsertLessonProgress(
      { studentId, lessonId: input.lessonId },
      {
        institutionId: new Types.ObjectId(institutionId),
        studentId: new Types.ObjectId(studentId),
        lessonId: new Types.ObjectId(input.lessonId),
        moduleId: new Types.ObjectId(input.moduleId),
        courseId: new Types.ObjectId(input.courseId),
        watchPercentage,
        readingPercentage,
        completed,
        status: completed ? 'completed' : 'in_progress',
        completedAt: completed ? (existing?.completedAt ?? now) : null,
        lastAccessedAt: now,
        visitCount: existing?.visitCount ?? 1,
        timeSpentSeconds: existing?.timeSpentSeconds ?? 0,
        lastPosition: existing?.lastPosition ?? 0,
      },
    );

    if (completed && !existing?.completed) {
      await progressRepository.createActivity({
        institutionId,
        studentId,
        courseId: input.courseId,
        moduleId: input.moduleId,
        lessonId: input.lessonId,
        type: 'lesson_completed',
      });
      await this.audit('lesson_completed', actor, institutionId, {
        studentId,
        courseId: input.courseId,
        moduleId: input.moduleId,
        lessonId: input.lessonId,
        enrollmentId: String(enrollment._id),
      });
      eventBus.emit(EVENTS.LESSON_COMPLETED, {
        courseId: input.courseId,
        moduleId: input.moduleId,
        lessonId: input.lessonId,
        studentId,
        institutionId,
      });
    }

    await this.rollupProgress(actor, institutionId, studentId, input.courseId, {
      enrollmentId: String(enrollment._id),
      currentModuleId: input.moduleId,
      currentLessonId: input.lessonId,
      lessonJustCompleted: { moduleId: input.moduleId, lessonId: input.lessonId },
    });

    return toDto(lesson);
  }

  async updateLessonProgress(input: UpdateLessonProgressInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    const enrollment = await this.requireActiveEnrollment(
      institutionId,
      studentId,
      input.courseId,
    );

    const existing = await progressRepository.findLessonProgress(studentId, input.lessonId);
    const watchPercentage = clampPercent(
      input.watchPercentage ?? existing?.watchPercentage ?? 0,
    );
    const readingPercentage = clampPercent(
      input.readingPercentage ?? existing?.readingPercentage ?? 0,
    );
    const completed = isLessonComplete({
      watchPercentage,
      readingPercentage,
      manuallyCompleted: existing?.completed,
    });
    const now = new Date();
    const timeSpentSeconds =
      (existing?.timeSpentSeconds ?? 0) + (input.timeSpentSeconds ?? 0);

    const wasCompleted = existing?.completed === true;

    const lesson = await progressRepository.upsertLessonProgress(
      { studentId, lessonId: input.lessonId },
      {
        institutionId: new Types.ObjectId(institutionId),
        studentId: new Types.ObjectId(studentId),
        lessonId: new Types.ObjectId(input.lessonId),
        moduleId: new Types.ObjectId(input.moduleId),
        courseId: new Types.ObjectId(input.courseId),
        watchPercentage,
        readingPercentage,
        lastPosition: input.lastPosition ?? existing?.lastPosition ?? 0,
        timeSpentSeconds,
        completed,
        status: completed ? 'completed' : watchPercentage > 0 || readingPercentage > 0
          ? 'in_progress'
          : (existing?.status ?? 'not_started'),
        completedAt: completed ? (existing?.completedAt ?? now) : null,
        lastAccessedAt: now,
        visitCount: existing?.visitCount ?? 1,
      },
    );

    if (completed && !wasCompleted) {
      await progressRepository.createActivity({
        institutionId,
        studentId,
        courseId: input.courseId,
        moduleId: input.moduleId,
        lessonId: input.lessonId,
        type: 'lesson_completed',
      });
      await this.audit('lesson_completed', actor, institutionId, {
        studentId,
        courseId: input.courseId,
        moduleId: input.moduleId,
        lessonId: input.lessonId,
        enrollmentId: String(enrollment._id),
      });
      eventBus.emit(EVENTS.LESSON_COMPLETED, {
        courseId: input.courseId,
        moduleId: input.moduleId,
        lessonId: input.lessonId,
        studentId,
        institutionId,
      });
    }

    await this.rollupProgress(actor, institutionId, studentId, input.courseId, {
      enrollmentId: String(enrollment._id),
      currentModuleId: input.moduleId,
      currentLessonId: input.lessonId,
      resumePosition: input.resumePosition as Record<string, unknown> | undefined,
      extraTimeMinutes: secondsToMinutes(input.timeSpentSeconds ?? 0),
    });

    return toDto(lesson);
  }

  async updateResourceProgress(input: ResourceProgressUpdateInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    await this.requireActiveEnrollment(institutionId, studentId, input.courseId);

    const existing = await progressRepository.findResourceProgress(
      studentId,
      input.resourceId,
    );
    const viewed = input.viewed ?? existing?.viewed ?? false;
    const downloaded = input.downloaded ?? existing?.downloaded ?? false;
    const completed = input.completed ?? existing?.completed ?? false;
    const timeSpentSeconds =
      (existing?.timeSpentSeconds ?? 0) + (input.timeSpentSeconds ?? 0);

    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (completed) status = 'completed';
    else if (viewed || downloaded || timeSpentSeconds > 0) status = 'in_progress';

    const doc = await progressRepository.upsertResourceProgress(
      { studentId, resourceId: input.resourceId },
      {
        institutionId: new Types.ObjectId(institutionId),
        studentId: new Types.ObjectId(studentId),
        resourceId: new Types.ObjectId(input.resourceId),
        lessonId: new Types.ObjectId(input.lessonId),
        courseId: new Types.ObjectId(input.courseId),
        viewed,
        downloaded,
        completed,
        timeSpentSeconds,
        status,
      },
    );

    if (viewed && !existing?.viewed) {
      await progressRepository.createActivity({
        institutionId,
        studentId,
        courseId: input.courseId,
        lessonId: input.lessonId,
        resourceId: input.resourceId,
        type: 'resource_viewed',
      });
    }
    if (downloaded && !existing?.downloaded) {
      await progressRepository.createActivity({
        institutionId,
        studentId,
        courseId: input.courseId,
        lessonId: input.lessonId,
        resourceId: input.resourceId,
        type: 'resource_downloaded',
      });
    }

    await this.audit('resource_progress_updated', actor, institutionId, {
      studentId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      resourceId: input.resourceId,
    });

    return toDto(doc);
  }

  async startSession(input: StartSessionInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    await this.requireActiveEnrollment(institutionId, studentId, input.courseId);

    const session = await progressRepository.createSession({
      institutionId: new Types.ObjectId(institutionId),
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(input.courseId),
      lessonId: input.lessonId ? new Types.ObjectId(input.lessonId) : null,
      startedAt: new Date(),
      endedAt: null,
      idleSeconds: 0,
      activeSeconds: 0,
      totalSeconds: 0,
    });

    await progressRepository.createActivity({
      institutionId,
      studentId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      type: 'session_started',
    });

    await this.audit('session_started', actor, institutionId, {
      studentId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      metadata: { sessionId: String(session._id) },
    });

    return toDto(session);
  }

  async endSession(input: EndSessionInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);

    const existing = await progressRepository.findSession(institutionId, input.sessionId);
    if (!existing) throw new NotFoundError('Session not found');
    if (String(existing.studentId) !== studentId) {
      throw new ForbiddenError('Access denied');
    }
    if (existing.endedAt) {
      throw new ValidationError('Session already ended');
    }

    const endedAt = new Date();
    const startedAt = existing.startedAt ? new Date(existing.startedAt) : endedAt;
    const elapsed = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));
    const idleSeconds = input.idleSeconds ?? 0;
    const activeSeconds =
      input.activeSeconds ?? Math.max(0, elapsed - idleSeconds);
    const totalSeconds = idleSeconds + activeSeconds;

    const session = await progressRepository.updateSession(institutionId, input.sessionId, {
      endedAt,
      idleSeconds,
      activeSeconds,
      totalSeconds,
    });

    const courseId = String(existing.courseId);
    const enrollment = await this.requireActiveEnrollment(institutionId, studentId, courseId);

    await progressRepository.createActivity({
      institutionId,
      studentId,
      courseId,
      lessonId: existing.lessonId ? String(existing.lessonId) : null,
      type: 'session_ended',
      durationSeconds: activeSeconds,
    });

    await this.audit('session_ended', actor, institutionId, {
      studentId,
      courseId,
      enrollmentId: String(enrollment._id),
      metadata: { sessionId: input.sessionId, activeSeconds, idleSeconds },
    });

    await this.rollupProgress(actor, institutionId, studentId, courseId, {
      enrollmentId: String(enrollment._id),
      extraTimeMinutes: secondsToMinutes(activeSeconds),
    });

    return toDto(session!);
  }

  async listBookmarks(query: BookmarkListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    const result = await progressRepository.listBookmarks(institutionId, studentId, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async createBookmark(input: CreateBookmarkInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    const enrollment = await this.requireActiveEnrollment(
      institutionId,
      studentId,
      input.courseId,
    );

    await this.ensureCourseProgress(
      institutionId,
      studentId,
      input.courseId,
      String(enrollment._id),
    );

    const bookmark = await progressRepository.createBookmark({
      institutionId: new Types.ObjectId(institutionId),
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(input.courseId),
      moduleId: input.moduleId ? new Types.ObjectId(input.moduleId) : null,
      lessonId: input.lessonId ? new Types.ObjectId(input.lessonId) : null,
      resourceId: input.resourceId ? new Types.ObjectId(input.resourceId) : null,
      targetType: input.targetType,
      note: input.note ?? null,
    });

    const count = await progressRepository.countBookmarks(
      institutionId,
      studentId,
      input.courseId,
    );
    await progressRepository.upsertCourseProgress(
      { institutionId, studentId, courseId: input.courseId },
      { bookmarksCount: count },
    );

    await progressRepository.createActivity({
      institutionId,
      studentId,
      courseId: input.courseId,
      moduleId: input.moduleId,
      lessonId: input.lessonId,
      resourceId: input.resourceId,
      type: 'bookmark_created',
    });

    await this.audit('bookmark_created', actor, institutionId, {
      studentId,
      courseId: input.courseId,
      moduleId: input.moduleId,
      lessonId: input.lessonId,
      resourceId: input.resourceId,
      enrollmentId: String(enrollment._id),
    });

    eventBus.emit(EVENTS.BOOKMARK_CREATED, {
      bookmarkId: String(bookmark._id),
      studentId,
      courseId: input.courseId,
      institutionId,
    });

    return toDto(bookmark);
  }

  async deleteBookmark(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    const existing = await progressRepository.findBookmark(institutionId, id);
    if (!existing) throw new NotFoundError('Bookmark not found');
    if (String(existing.studentId) !== studentId) {
      throw new ForbiddenError('Access denied');
    }

    await progressRepository.deleteBookmark(institutionId, id);

    const courseId = String(existing.courseId);
    const count = await progressRepository.countBookmarks(institutionId, studentId, courseId);
    await progressRepository.upsertCourseProgress(
      { institutionId, studentId, courseId },
      { bookmarksCount: count },
    );

    await this.audit('bookmark_deleted', actor, institutionId, {
      studentId,
      courseId,
      metadata: { bookmarkId: id },
    });

    return { success: true };
  }

  async listNotes(query: NoteListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    const result = await progressRepository.listNotes(institutionId, studentId, query);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async createNote(input: CreateNoteInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    const enrollment = await this.requireActiveEnrollment(
      institutionId,
      studentId,
      input.courseId,
    );

    await this.ensureCourseProgress(
      institutionId,
      studentId,
      input.courseId,
      String(enrollment._id),
    );

    const note = await progressRepository.createNote({
      institutionId: new Types.ObjectId(institutionId),
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(input.courseId),
      lessonId: new Types.ObjectId(input.lessonId),
      text: input.text,
    });

    const count = await progressRepository.countNotes(institutionId, studentId, input.courseId);
    await progressRepository.upsertCourseProgress(
      { institutionId, studentId, courseId: input.courseId },
      { notesCount: count },
    );

    await progressRepository.createActivity({
      institutionId,
      studentId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      type: 'note_created',
    });

    await this.audit('note_created', actor, institutionId, {
      studentId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      enrollmentId: String(enrollment._id),
    });

    eventBus.emit(EVENTS.NOTE_CREATED, {
      noteId: String(note._id),
      studentId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      institutionId,
    });

    return toDto(note);
  }

  async updateNote(id: string, input: UpdateNoteInput, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    const existing = await progressRepository.findNote(institutionId, id);
    if (!existing) throw new NotFoundError('Note not found');
    if (String(existing.studentId) !== studentId) {
      throw new ForbiddenError('Access denied');
    }

    const note = await progressRepository.updateNote(institutionId, id, { text: input.text });
    await this.audit('note_updated', actor, institutionId, {
      studentId,
      courseId: String(existing.courseId),
      lessonId: String(existing.lessonId),
      metadata: { noteId: id },
    });

    return toDto(note!);
  }

  async deleteNote(id: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    const existing = await progressRepository.findNote(institutionId, id);
    if (!existing) throw new NotFoundError('Note not found');
    if (String(existing.studentId) !== studentId) {
      throw new ForbiddenError('Access denied');
    }

    await progressRepository.deleteNote(institutionId, id);

    const courseId = String(existing.courseId);
    const count = await progressRepository.countNotes(institutionId, studentId, courseId);
    await progressRepository.upsertCourseProgress(
      { institutionId, studentId, courseId },
      { notesCount: count },
    );

    await this.audit('note_deleted', actor, institutionId, {
      studentId,
      courseId,
      metadata: { noteId: id },
    });

    return { success: true };
  }

  async exportNotes(format: 'csv' | 'json', actor: ActorContext, courseId?: string) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    const notes = await progressRepository.listAllNotes(institutionId, studentId, courseId);

    await this.audit('notes_exported', actor, institutionId, {
      studentId,
      courseId,
      metadata: { format, count: notes.length },
    });

    if (format === 'json') {
      return { data: notes.map(toDto), format: 'json' as const };
    }

    const headers = ['id', 'courseId', 'lessonId', 'text', 'createdAt', 'updatedAt'];
    const lines = [headers.join(',')];
    for (const note of notes) {
      const row = toDto(note);
      lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
    }
    return { data: `${lines.join('\n')}\n`, format: 'csv' as const };
  }

  async listActivity(query: ActivityListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    let studentId: string | undefined;

    if (actor.role === 'student') {
      studentId = await this.resolveStudentId(actor, institutionId);
    } else if (query.studentId) {
      studentId = query.studentId;
    }

    const result = await progressRepository.listActivity(institutionId, {
      ...query,
      studentId,
    });

    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async studentDashboard(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await this.resolveStudentId(actor, institutionId);
    const counts = await progressRepository.getStudentDashboardCounts(
      institutionId,
      studentId,
    );

    const courseIds = counts.continueLearning.map((c) => c.courseId);
    const courses = await CourseModel.find({
      _id: { $in: courseIds },
      institutionId: new Types.ObjectId(institutionId),
    })
      .select('_id title')
      .exec();
    const titleById = new Map(courses.map((c) => [String(c._id), c.title]));

    const recent = await progressRepository.listActivity(institutionId, {
      studentId,
      page: 1,
      limit: 10,
    });

    // Simple streak: consecutive days with activity ending today/yesterday
    const activities = await progressRepository.listActivity(institutionId, {
      studentId,
      page: 1,
      limit: 100,
    });
    const days = new Set(
      activities.items.map((a) => new Date(a.occurredAt).toISOString().slice(0, 10)),
    );
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().slice(0, 10);
      if (days.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (i === 0) {
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      coursesInProgress: counts.coursesInProgress,
      completedCourses: counts.completedCourses,
      hoursLearned: counts.hoursLearned,
      lessonsCompleted: counts.lessonsCompleted,
      modulesCompleted: counts.modulesCompleted,
      bookmarks: counts.bookmarks,
      notes: counts.notes,
      currentStreakDays: streak,
      continueLearning: counts.continueLearning.map((c) => ({
        courseId: String(c.courseId),
        courseTitle: titleById.get(String(c.courseId)) ?? 'Course',
        progressPercentage: c.progressPercentage,
        currentModuleId: c.currentModuleId ? String(c.currentModuleId) : null,
        currentLessonId: c.currentLessonId ? String(c.currentLessonId) : null,
        estimatedRemainingMinutes: c.estimatedRemainingMinutes,
      })),
      recentActivity: recent.items.map(toDto),
    };
  }

  async facultyDashboard(courseId: string | undefined, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (!courseId) {
      throw new ValidationError('courseId is required');
    }
    await this.ensureFacultyCourseAccess(actor, institutionId, courseId);
    return progressRepository.getFacultyCourseAnalytics(institutionId, courseId);
  }

  async institutionDashboard(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    if (actor.role === 'student') {
      throw new ForbiddenError('Access denied');
    }
    return progressRepository.getInstitutionAnalytics(institutionId);
  }

  async getStats(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId =
      actor.role === 'student'
        ? await this.resolveStudentId(actor, institutionId)
        : null;
    return progressRepository.getStats(institutionId, studentId);
  }

  async search(q: string, page: number, limit: number, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId =
      actor.role === 'student'
        ? await this.resolveStudentId(actor, institutionId)
        : null;
    const result = await progressRepository.searchCourseProgress(
      institutionId,
      studentId,
      q,
      page,
      limit,
    );
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }
}

export const progressService = new ProgressService();
