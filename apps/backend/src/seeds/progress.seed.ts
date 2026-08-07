import { Types } from 'mongoose';
import { EnrollmentModel } from '../models/enrollment.model.js';
import { CourseModuleModel } from '../models/course-module.model.js';
import { CourseLessonModel } from '../models/course-lesson.model.js';
import { CourseProgressModel } from '../models/course-progress.model.js';
import { ModuleProgressModel } from '../models/module-progress.model.js';
import { LessonProgressModel } from '../models/lesson-progress.model.js';
import { LearningBookmarkModel } from '../models/learning-bookmark.model.js';
import { LearningNoteModel } from '../models/learning-note.model.js';
import { LearningActivityModel } from '../models/learning-activity.model.js';
import { logger } from '../utils/logger/index.js';
import {
  clampPercent,
  computeCompletionPercentage,
  deriveLearningStatus,
  isLessonComplete,
} from '../services/progress/progress.helpers.js';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export interface SeedProgressOptions {
  force?: boolean;
  /** Cap how many enrollments get progress (default: all active/approved, max 500) */
  limit?: number;
}

export async function seedProgress(
  institutionId: string,
  options: SeedProgressOptions = {},
): Promise<{
  courseProgress: number;
  moduleProgress: number;
  lessonProgress: number;
  bookmarks: number;
  notes: number;
  activities: number;
  skippedNoContent: number;
}> {
  const oid = new Types.ObjectId(institutionId);
  const limit = options.limit ?? 500;

  logger.info({ institutionId, limit }, 'Starting progress seed');

  const existing = await CourseProgressModel.countDocuments({ institutionId: oid });
  if (existing > 0 && !options.force) {
    logger.info({ existing }, 'Course progress already exists, skipping (set SEED_FORCE=1 to replace)');
    return {
      courseProgress: existing,
      moduleProgress: 0,
      lessonProgress: 0,
      bookmarks: 0,
      notes: 0,
      activities: 0,
      skippedNoContent: 0,
    };
  }

  if (options.force && existing > 0) {
    await Promise.all([
      CourseProgressModel.deleteMany({ institutionId: oid }),
      ModuleProgressModel.deleteMany({ institutionId: oid }),
      LessonProgressModel.deleteMany({ institutionId: oid }),
      LearningBookmarkModel.deleteMany({ institutionId: oid }),
      LearningNoteModel.deleteMany({ institutionId: oid }),
      LearningActivityModel.deleteMany({ institutionId: oid }),
    ]);
    logger.info({ existing }, 'Cleared existing progress data');
  }

  const enrollments = await EnrollmentModel.find({
    institutionId: oid,
    deletedAt: null,
    status: { $in: ['active', 'approved', 'completed'] },
  })
    .limit(limit)
    .lean()
    .exec();

  if (enrollments.length === 0) {
    throw new Error(
      'No active/approved enrollments found. Run seed:enrollments first.',
    );
  }

  const courseIds = [...new Set(enrollments.map((e) => String(e.courseId)))];

  const [modules, lessons] = await Promise.all([
    CourseModuleModel.find({
      institutionId: oid,
      courseId: { $in: courseIds.map((id) => new Types.ObjectId(id)) },
      status: 'published',
      deletedAt: null,
    })
      .lean()
      .exec(),
    CourseLessonModel.find({
      institutionId: oid,
      courseId: { $in: courseIds.map((id) => new Types.ObjectId(id)) },
      status: 'published',
      deletedAt: null,
    })
      .lean()
      .exec(),
  ]);

  const modulesByCourse = new Map<string, typeof modules>();
  for (const m of modules) {
    const key = String(m.courseId);
    const list = modulesByCourse.get(key) ?? [];
    list.push(m);
    modulesByCourse.set(key, list);
  }

  const lessonsByCourse = new Map<string, typeof lessons>();
  const lessonsByModule = new Map<string, typeof lessons>();
  for (const l of lessons) {
    const cKey = String(l.courseId);
    const cList = lessonsByCourse.get(cKey) ?? [];
    cList.push(l);
    lessonsByCourse.set(cKey, cList);

    const mKey = String(l.moduleId);
    const mList = lessonsByModule.get(mKey) ?? [];
    mList.push(l);
    lessonsByModule.set(mKey, mList);
  }

  const courseProgressDocs: Record<string, unknown>[] = [];
  const moduleProgressDocs: Record<string, unknown>[] = [];
  const lessonProgressDocs: Record<string, unknown>[] = [];
  const bookmarkDocs: Record<string, unknown>[] = [];
  const noteDocs: Record<string, unknown>[] = [];
  const activityDocs: Record<string, unknown>[] = [];
  let skippedNoContent = 0;

  for (const enrollment of enrollments) {
    const studentId = enrollment.studentId;
    const courseId = enrollment.courseId;
    const courseKey = String(courseId);
    const courseModules = modulesByCourse.get(courseKey) ?? [];
    const courseLessons = lessonsByCourse.get(courseKey) ?? [];

    const hasContent = courseModules.length > 0 && courseLessons.length > 0;
    if (!hasContent) skippedNoContent++;

    let progressPercentage = 0;
    let status: 'not_started' | 'in_progress' | 'completed' | 'paused' = 'not_started';
    let completedLessonCount = 0;
    let currentModuleId: Types.ObjectId | null = null;
    let currentLessonId: Types.ObjectId | null = null;
    let bookmarksCount = 0;
    let notesCount = 0;
    const timeSpentMinutes = randomInt(0, 240);
    const startedAt = daysAgo(randomInt(1, 60));
    const lastAccessedAt = daysAgo(randomInt(0, 14));

    if (hasContent) {
      // Complete a random prefix of lessons for realism
      const completeRatio = Math.random();
      const targetComplete = Math.floor(courseLessons.length * completeRatio);

      for (let i = 0; i < courseLessons.length; i++) {
        const lesson = courseLessons[i]!;
        const shouldComplete = i < targetComplete;
        const watchPercentage = shouldComplete
          ? 100
          : i === targetComplete
            ? randomInt(10, 90)
            : 0;
        const readingPercentage = shouldComplete
          ? 100
          : i === targetComplete
            ? randomInt(10, 90)
            : 0;
        const completed = isLessonComplete({
          watchPercentage,
          readingPercentage,
          manuallyCompleted: shouldComplete && randomBool(0.2),
        });

        if (completed) completedLessonCount++;

        const lessonStatus = deriveLearningStatus({
          completedCount: completed ? 1 : 0,
          totalCount: 1,
          previouslyStarted: watchPercentage > 0 || readingPercentage > 0,
        });

        lessonProgressDocs.push({
          institutionId: oid,
          studentId,
          lessonId: lesson._id,
          moduleId: lesson.moduleId,
          courseId,
          status: lessonStatus,
          watchPercentage: clampPercent(watchPercentage),
          readingPercentage: clampPercent(readingPercentage),
          timeSpentSeconds: randomInt(0, 3600),
          completed,
          completedAt: completed ? daysAgo(randomInt(0, 30)) : null,
          lastPosition: randomInt(0, 500),
          lastAccessedAt: watchPercentage > 0 || readingPercentage > 0 ? lastAccessedAt : null,
          visitCount: watchPercentage > 0 || readingPercentage > 0 ? randomInt(1, 8) : 0,
        });

        if (watchPercentage > 0 || readingPercentage > 0) {
          currentModuleId = lesson.moduleId as Types.ObjectId;
          currentLessonId = lesson._id as Types.ObjectId;
        }
      }

      for (const mod of courseModules) {
        const modLessons = lessonsByModule.get(String(mod._id)) ?? [];
        const completedInMod = lessonProgressDocs.filter(
          (lp) =>
            String(lp.moduleId) === String(mod._id) &&
            String(lp.studentId) === String(studentId) &&
            lp.completed === true,
        ).length;
        const pct = computeCompletionPercentage(completedInMod, modLessons.length);
        const modStatus = deriveLearningStatus({
          completedCount: completedInMod,
          totalCount: modLessons.length,
          previouslyStarted: completedInMod > 0 || pct > 0,
        });

        moduleProgressDocs.push({
          institutionId: oid,
          studentId,
          moduleId: mod._id,
          courseId,
          completionPercentage: pct,
          status: modStatus,
          timeSpentMinutes: randomInt(0, 60),
          startedAt: modStatus !== 'not_started' ? startedAt : null,
          completedAt: modStatus === 'completed' ? lastAccessedAt : null,
          lastAccessedAt: modStatus !== 'not_started' ? lastAccessedAt : null,
        });
      }

      progressPercentage = computeCompletionPercentage(
        completedLessonCount,
        courseLessons.length,
      );
      status = deriveLearningStatus({
        completedCount: completedLessonCount,
        totalCount: courseLessons.length,
        previouslyStarted: completedLessonCount > 0 || progressPercentage > 0,
        paused: randomBool(0.05),
      });
      if (status === 'paused' && progressPercentage >= 100) status = 'completed';
    } else {
      progressPercentage = randomInt(0, 100);
      status =
        progressPercentage === 0
          ? 'not_started'
          : progressPercentage >= 100
            ? 'completed'
            : randomBool(0.1)
              ? 'paused'
              : 'in_progress';
    }

    // Bookmarks / notes for a subset
    if (hasContent && randomBool(0.35) && courseLessons.length > 0) {
      const lesson = randomItem(courseLessons);
      bookmarkDocs.push({
        institutionId: oid,
        studentId,
        courseId,
        moduleId: lesson.moduleId,
        lessonId: lesson._id,
        resourceId: null,
        targetType: 'lesson',
        note: randomBool(0.4) ? 'Review this later' : null,
      });
      bookmarksCount = 1;
    }

    if (hasContent && randomBool(0.3) && courseLessons.length > 0) {
      const lesson = randomItem(courseLessons);
      noteDocs.push({
        institutionId: oid,
        studentId,
        courseId,
        lessonId: lesson._id,
        text: `Seed note: key takeaway from ${lesson.title}`,
      });
      notesCount = 1;
    }

    if (randomBool(0.5)) {
      activityDocs.push({
        institutionId: oid,
        studentId,
        courseId,
        moduleId: currentModuleId,
        lessonId: currentLessonId,
        type: status === 'completed' ? 'course_completed' : 'lesson_opened',
        durationSeconds: randomInt(60, 1800),
        metadata: { seeded: true },
        occurredAt: lastAccessedAt,
      });
    }

    courseProgressDocs.push({
      institutionId: oid,
      studentId,
      courseId,
      enrollmentId: enrollment._id,
      progressPercentage,
      status,
      startedAt: status === 'not_started' ? null : startedAt,
      lastAccessedAt: status === 'not_started' ? null : lastAccessedAt,
      completedAt: status === 'completed' ? lastAccessedAt : null,
      estimatedRemainingMinutes: Math.max(0, Math.round((100 - progressPercentage) * 0.5)),
      timeSpentMinutes,
      currentModuleId,
      currentLessonId,
      resumePosition: {
        scrollY: currentLessonId ? randomInt(0, 800) : null,
        videoSeconds: currentLessonId ? randomInt(0, 600) : null,
        markdownOffset: null,
        lastResourceId: null,
      },
      bookmarksCount,
      notesCount,
    });
  }

  if (courseProgressDocs.length > 0) {
    await CourseProgressModel.insertMany(courseProgressDocs, { ordered: false });
  }
  if (moduleProgressDocs.length > 0) {
    await ModuleProgressModel.insertMany(moduleProgressDocs, { ordered: false });
  }
  if (lessonProgressDocs.length > 0) {
    // Chunk to avoid huge payloads
    const chunkSize = 1000;
    for (let i = 0; i < lessonProgressDocs.length; i += chunkSize) {
      await LessonProgressModel.insertMany(lessonProgressDocs.slice(i, i + chunkSize), {
        ordered: false,
      });
    }
  }
  if (bookmarkDocs.length > 0) {
    await LearningBookmarkModel.insertMany(bookmarkDocs, { ordered: false });
  }
  if (noteDocs.length > 0) {
    await LearningNoteModel.insertMany(noteDocs, { ordered: false });
  }
  if (activityDocs.length > 0) {
    await LearningActivityModel.insertMany(activityDocs, { ordered: false });
  }

  const result = {
    courseProgress: courseProgressDocs.length,
    moduleProgress: moduleProgressDocs.length,
    lessonProgress: lessonProgressDocs.length,
    bookmarks: bookmarkDocs.length,
    notes: noteDocs.length,
    activities: activityDocs.length,
    skippedNoContent,
  };

  logger.info(result, 'Progress seed completed');
  return result;
}
