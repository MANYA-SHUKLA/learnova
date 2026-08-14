import { Types } from 'mongoose';
import type { ProgressListQuery, BookmarkListQuery, NoteListQuery, ActivityListQuery } from '@learnova/validation';
import {
  CourseProgressModel,
  type CourseProgressDocument,
} from '../../models/course-progress.model.js';
import {
  ModuleProgressModel,
  type ModuleProgressDocument,
} from '../../models/module-progress.model.js';
import {
  LessonProgressModel,
  type LessonProgressDocument,
} from '../../models/lesson-progress.model.js';
import {
  ResourceProgressModel,
  type ResourceProgressDocument,
} from '../../models/resource-progress.model.js';
import {
  LearningBookmarkModel,
  type LearningBookmarkDocument,
} from '../../models/learning-bookmark.model.js';
import { LearningNoteModel, type LearningNoteDocument } from '../../models/learning-note.model.js';
import { LabProgressModel } from '../../models/lab-progress.model.js';
import {
  LearningActivityModel,
  type LearningActivityDocument,
  type LearningActivityEventType,
} from '../../models/learning-activity.model.js';
import {
  LearningSessionModel,
  type LearningSessionDocument,
} from '../../models/learning-session.model.js';
import {
  ProgressAuditLogModel,
  type ProgressAuditEvent,
} from '../../models/progress-audit-log.model.js';

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class ProgressRepository {
  // ── Course progress ──────────────────────────────────────────────

  async findCourseProgress(
    institutionId: string,
    studentId: string,
    courseId: string,
  ): Promise<CourseProgressDocument | null> {
    return CourseProgressModel.findOne({
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
      courseId: toObjectId(courseId),
    }).exec();
  }

  async findCourseProgressByEnrollment(
    institutionId: string,
    enrollmentId: string,
  ): Promise<CourseProgressDocument | null> {
    return CourseProgressModel.findOne({
      institutionId: toObjectId(institutionId),
      enrollmentId: toObjectId(enrollmentId),
    }).exec();
  }

  async upsertCourseProgress(
    filter: { institutionId: string; studentId: string; courseId: string },
    data: Record<string, unknown>,
  ): Promise<CourseProgressDocument> {
    return CourseProgressModel.findOneAndUpdate(
      {
        institutionId: toObjectId(filter.institutionId),
        studentId: toObjectId(filter.studentId),
        courseId: toObjectId(filter.courseId),
      },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec() as Promise<CourseProgressDocument>;
  }

  async createCourseProgress(data: Record<string, unknown>): Promise<CourseProgressDocument> {
    return CourseProgressModel.create(data);
  }

  async updateCourseProgress(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<CourseProgressDocument | null> {
    return CourseProgressModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId) },
      { $set: data },
      { new: true },
    ).exec();
  }

  async listCourseProgress(
    institutionId: string,
    studentId: string,
    query: ProgressListQuery,
  ): Promise<{ items: CourseProgressDocument[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
    };
    if (query.status) filter.status = query.status;
    if (query.courseId) filter.courseId = toObjectId(query.courseId);
    if (query.bookmarked) filter.bookmarksCount = { $gt: 0 };
    if (query.recent) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filter.lastAccessedAt = { $gte: weekAgo };
    }

    const page = query.page;
    const limit = query.limit;
    const sortField = query.sortBy ?? 'lastAccessedAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      CourseProgressModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      CourseProgressModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async searchCourseProgress(
    institutionId: string,
    studentId: string | null,
    q: string,
    page: number,
    limit: number,
  ): Promise<{ items: CourseProgressDocument[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
    };
    if (studentId) filter.studentId = toObjectId(studentId);

    // Search is primarily by status / ids stored as strings is limited; match status tokens lightly
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ status: regex }];

    const [items, total] = await Promise.all([
      CourseProgressModel.find(filter)
        .sort({ lastAccessedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      CourseProgressModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  // ── Module progress ──────────────────────────────────────────────

  async findModuleProgress(
    institutionId: string,
    studentId: string,
    moduleId: string,
  ): Promise<ModuleProgressDocument | null> {
    return ModuleProgressModel.findOne({
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
      moduleId: toObjectId(moduleId),
    }).exec();
  }

  async upsertModuleProgress(
    filter: { institutionId: string; studentId: string; moduleId: string },
    data: Record<string, unknown>,
  ): Promise<ModuleProgressDocument> {
    return ModuleProgressModel.findOneAndUpdate(
      {
        institutionId: toObjectId(filter.institutionId),
        studentId: toObjectId(filter.studentId),
        moduleId: toObjectId(filter.moduleId),
      },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec() as Promise<ModuleProgressDocument>;
  }

  async listModuleProgress(
    institutionId: string,
    studentId: string,
    courseId: string,
  ): Promise<ModuleProgressDocument[]> {
    return ModuleProgressModel.find({
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
      courseId: toObjectId(courseId),
    }).exec();
  }

  // ── Lesson progress ──────────────────────────────────────────────

  async findLessonProgress(
    studentId: string,
    lessonId: string,
  ): Promise<LessonProgressDocument | null> {
    return LessonProgressModel.findOne({
      studentId: toObjectId(studentId),
      lessonId: toObjectId(lessonId),
    }).exec();
  }

  async upsertLessonProgress(
    filter: { studentId: string; lessonId: string },
    data: Record<string, unknown>,
  ): Promise<LessonProgressDocument> {
    return LessonProgressModel.findOneAndUpdate(
      {
        studentId: toObjectId(filter.studentId),
        lessonId: toObjectId(filter.lessonId),
      },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec() as Promise<LessonProgressDocument>;
  }

  async listLessonProgress(
    institutionId: string,
    studentId: string,
    courseId: string,
  ): Promise<LessonProgressDocument[]> {
    return LessonProgressModel.find({
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
      courseId: toObjectId(courseId),
    }).exec();
  }

  async listLessonProgressByModule(
    institutionId: string,
    studentId: string,
    moduleId: string,
  ): Promise<LessonProgressDocument[]> {
    return LessonProgressModel.find({
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
      moduleId: toObjectId(moduleId),
    }).exec();
  }

  async countCompletedLessons(
    institutionId: string,
    studentId: string,
    courseId: string,
  ): Promise<number> {
    return LessonProgressModel.countDocuments({
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
      courseId: toObjectId(courseId),
      completed: true,
    }).exec();
  }

  // ── Resource progress ────────────────────────────────────────────

  async upsertResourceProgress(
    filter: { studentId: string; resourceId: string },
    data: Record<string, unknown>,
  ): Promise<ResourceProgressDocument> {
    return ResourceProgressModel.findOneAndUpdate(
      {
        studentId: toObjectId(filter.studentId),
        resourceId: toObjectId(filter.resourceId),
      },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec() as Promise<ResourceProgressDocument>;
  }

  async findResourceProgress(
    studentId: string,
    resourceId: string,
  ): Promise<ResourceProgressDocument | null> {
    return ResourceProgressModel.findOne({
      studentId: toObjectId(studentId),
      resourceId: toObjectId(resourceId),
    }).exec();
  }

  // ── Bookmarks ────────────────────────────────────────────────────

  async createBookmark(data: Record<string, unknown>): Promise<LearningBookmarkDocument> {
    return LearningBookmarkModel.create(data);
  }

  async findBookmark(
    institutionId: string,
    id: string,
  ): Promise<LearningBookmarkDocument | null> {
    return LearningBookmarkModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
  }

  async deleteBookmark(institutionId: string, id: string): Promise<boolean> {
    const res = await LearningBookmarkModel.deleteOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
    return res.deletedCount > 0;
  }

  async listBookmarks(
    institutionId: string,
    studentId: string,
    query: BookmarkListQuery,
  ): Promise<{ items: LearningBookmarkDocument[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
    };
    if (query.courseId) filter.courseId = toObjectId(query.courseId);
    if (query.targetType) filter.targetType = query.targetType;
    if (query.q) {
      filter.note = new RegExp(escapeRegex(query.q), 'i');
    }

    const page = query.page;
    const limit = query.limit;

    const [items, total] = await Promise.all([
      LearningBookmarkModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      LearningBookmarkModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async countBookmarks(institutionId: string, studentId: string, courseId?: string): Promise<number> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
    };
    if (courseId) filter.courseId = toObjectId(courseId);
    return LearningBookmarkModel.countDocuments(filter).exec();
  }

  // ── Notes ────────────────────────────────────────────────────────

  async createNote(data: Record<string, unknown>): Promise<LearningNoteDocument> {
    return LearningNoteModel.create(data);
  }

  async findNote(institutionId: string, id: string): Promise<LearningNoteDocument | null> {
    return LearningNoteModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
  }

  async updateNote(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<LearningNoteDocument | null> {
    return LearningNoteModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId) },
      { $set: data },
      { new: true },
    ).exec();
  }

  async deleteNote(institutionId: string, id: string): Promise<boolean> {
    const res = await LearningNoteModel.deleteOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
    return res.deletedCount > 0;
  }

  async listNotes(
    institutionId: string,
    studentId: string,
    query: NoteListQuery,
  ): Promise<{ items: LearningNoteDocument[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
    };
    if (query.courseId) filter.courseId = toObjectId(query.courseId);
    if (query.lessonId) filter.lessonId = toObjectId(query.lessonId);
    if (query.q) {
      filter.text = new RegExp(escapeRegex(query.q), 'i');
    }

    const page = query.page;
    const limit = query.limit;

    const [items, total] = await Promise.all([
      LearningNoteModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      LearningNoteModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async listAllNotes(
    institutionId: string,
    studentId: string,
    courseId?: string,
  ): Promise<LearningNoteDocument[]> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
    };
    if (courseId) filter.courseId = toObjectId(courseId);
    return LearningNoteModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async countNotes(institutionId: string, studentId: string, courseId?: string): Promise<number> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
    };
    if (courseId) filter.courseId = toObjectId(courseId);
    return LearningNoteModel.countDocuments(filter).exec();
  }

  // ── Activity ─────────────────────────────────────────────────────

  async createActivity(data: {
    institutionId: string;
    studentId: string;
    courseId?: string | null;
    moduleId?: string | null;
    lessonId?: string | null;
    resourceId?: string | null;
    type: LearningActivityEventType;
    durationSeconds?: number;
    metadata?: Record<string, unknown> | null;
    occurredAt?: Date;
  }): Promise<LearningActivityDocument> {
    return LearningActivityModel.create({
      institutionId: toObjectId(data.institutionId),
      studentId: toObjectId(data.studentId),
      courseId: data.courseId ? toObjectId(data.courseId) : null,
      moduleId: data.moduleId ? toObjectId(data.moduleId) : null,
      lessonId: data.lessonId ? toObjectId(data.lessonId) : null,
      resourceId: data.resourceId ? toObjectId(data.resourceId) : null,
      type: data.type,
      durationSeconds: data.durationSeconds ?? 0,
      metadata: data.metadata ?? null,
      occurredAt: data.occurredAt ?? new Date(),
    });
  }

  async listActivity(
    institutionId: string,
    query: ActivityListQuery & { studentId?: string },
  ): Promise<{ items: LearningActivityDocument[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
    };
    if (query.studentId) filter.studentId = toObjectId(query.studentId);
    if (query.courseId) filter.courseId = toObjectId(query.courseId);
    if (query.type) filter.type = query.type;

    const page = query.page;
    const limit = query.limit;

    const [items, total] = await Promise.all([
      LearningActivityModel.find(filter)
        .sort({ occurredAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      LearningActivityModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  // ── Sessions ─────────────────────────────────────────────────────

  async createSession(data: Record<string, unknown>): Promise<LearningSessionDocument> {
    return LearningSessionModel.create(data);
  }

  async findSession(
    institutionId: string,
    id: string,
  ): Promise<LearningSessionDocument | null> {
    return LearningSessionModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
  }

  async updateSession(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<LearningSessionDocument | null> {
    return LearningSessionModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId) },
      { $set: data },
      { new: true },
    ).exec();
  }

  // ── Audit ────────────────────────────────────────────────────────

  async logAudit(input: {
    event: ProgressAuditEvent;
    institutionId: string;
    studentId?: string | null;
    courseId?: string | null;
    moduleId?: string | null;
    lessonId?: string | null;
    resourceId?: string | null;
    enrollmentId?: string | null;
    userId?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return ProgressAuditLogModel.create({
      event: input.event,
      institutionId: toObjectId(input.institutionId),
      studentId: input.studentId ? toObjectId(input.studentId) : null,
      courseId: input.courseId ? toObjectId(input.courseId) : null,
      moduleId: input.moduleId ? toObjectId(input.moduleId) : null,
      lessonId: input.lessonId ? toObjectId(input.lessonId) : null,
      resourceId: input.resourceId ? toObjectId(input.resourceId) : null,
      enrollmentId: input.enrollmentId ? toObjectId(input.enrollmentId) : null,
      userId: input.userId ? toObjectId(input.userId) : null,
      email: input.email ?? null,
      metadata: input.metadata ?? {},
    });
  }

  // ── Stats / dashboards ───────────────────────────────────────────

  async getStats(institutionId: string, studentId?: string | null) {
    const match: Record<string, unknown> = { institutionId: toObjectId(institutionId) };
    if (studentId) match.studentId = toObjectId(studentId);

    const [agg] = await CourseProgressModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCourseProgress: { $sum: 1 },
          notStarted: { $sum: { $cond: [{ $eq: ['$status', 'not_started'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          paused: { $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] } },
          averageProgress: { $avg: '$progressPercentage' },
          totalMinutes: { $sum: '$timeSpentMinutes' },
        },
      },
    ]).exec();

    return {
      totalCourseProgress: agg?.totalCourseProgress ?? 0,
      notStarted: agg?.notStarted ?? 0,
      inProgress: agg?.inProgress ?? 0,
      completed: agg?.completed ?? 0,
      paused: agg?.paused ?? 0,
      averageProgress: Math.round(agg?.averageProgress ?? 0),
      totalHours: Math.round(((agg?.totalMinutes ?? 0) / 60) * 10) / 10,
    };
  }

  async getStudentDashboardCounts(institutionId: string, studentId: string) {
    const match = {
      institutionId: toObjectId(institutionId),
      studentId: toObjectId(studentId),
    };

    const [courseAgg] = await CourseProgressModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          coursesInProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },
          completedCourses: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalMinutes: { $sum: '$timeSpentMinutes' },
          bookmarks: { $sum: '$bookmarksCount' },
          notes: { $sum: '$notesCount' },
        },
      },
    ]).exec();

    const [lessonsCompleted, modulesCompleted] = await Promise.all([
      LessonProgressModel.countDocuments({ ...match, completed: true }).exec(),
      ModuleProgressModel.countDocuments({ ...match, status: 'completed' }).exec(),
    ]);

    const [labTimeAgg] = await LabProgressModel.aggregate([
      { $match: match },
      { $group: { _id: null, totalSeconds: { $sum: '$timeSpentSeconds' } } },
    ]).exec();
    const labMinutes = Math.round(((labTimeAgg?.totalSeconds ?? 0) / 60) * 10) / 10;
    const courseMinutes = Math.round(((courseAgg?.totalMinutes ?? 0) / 60) * 10) / 10;
    const combinedMinutes = Math.round((courseMinutes + labMinutes) * 10) / 10;

    const continueLearning = await CourseProgressModel.find({
      ...match,
      status: { $in: ['in_progress', 'paused'] },
    })
      .sort({ lastAccessedAt: -1 })
      .limit(5)
      .exec();

    return {
      coursesInProgress: courseAgg?.coursesInProgress ?? 0,
      completedCourses: courseAgg?.completedCourses ?? 0,
      hoursLearned: combinedMinutes,
      lessonsCompleted,
      modulesCompleted,
      bookmarks: courseAgg?.bookmarks ?? 0,
      notes: courseAgg?.notes ?? 0,
      continueLearning,
    };
  }

  async getFacultyCourseAnalytics(institutionId: string, courseId: string) {
    const match = {
      institutionId: toObjectId(institutionId),
      courseId: toObjectId(courseId),
    };

    const docs = await CourseProgressModel.find(match).exec();
    const total = docs.length;
    const averageProgress =
      total === 0
        ? 0
        : Math.round(docs.reduce((s, d) => s + (d.progressPercentage ?? 0), 0) / total);

    const studentsStarted = docs.filter((d) => d.status !== 'not_started').length;
    const studentsCompleted = docs.filter((d) => d.status === 'completed').length;
    const studentsInProgress = docs.filter((d) => d.status === 'in_progress').length;

    const sorted = [...docs].sort(
      (a, b) => (b.progressPercentage ?? 0) - (a.progressPercentage ?? 0),
    );
    const topLearners = sorted.slice(0, 5).map((d) => ({
      studentId: String(d.studentId),
      progressPercentage: d.progressPercentage ?? 0,
    }));

    const leastActive = [...docs]
      .sort((a, b) => {
        const aTime = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
        const bTime = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
        return aTime - bTime;
      })
      .slice(0, 5)
      .map((d) => ({
        studentId: String(d.studentId),
        progressPercentage: d.progressPercentage ?? 0,
        lastAccessedAt: d.lastAccessedAt ? new Date(d.lastAccessedAt).toISOString() : null,
      }));

    return {
      courseId,
      averageProgress,
      studentsStarted,
      studentsCompleted,
      studentsInProgress,
      topLearners,
      leastActive,
    };
  }

  async getInstitutionAnalytics(institutionId: string) {
    const match = { institutionId: toObjectId(institutionId) };

    const [agg] = await CourseProgressModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$timeSpentMinutes' },
          averageProgress: { $avg: '$progressPercentage' },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          total: { $sum: 1 },
          engaged: {
            $sum: {
              $cond: [{ $in: ['$status', ['in_progress', 'completed', 'paused']] }, 1, 0],
            },
          },
        },
      },
    ]).exec();

    const byCourse = await CourseProgressModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$courseId',
          hours: { $sum: { $divide: ['$timeSpentMinutes', 60] } },
          averageProgress: { $avg: '$progressPercentage' },
        },
      },
      { $sort: { hours: -1 } },
      { $limit: 10 },
    ]).exec();

    const total = agg?.total ?? 0;
    const completed = agg?.completed ?? 0;

    return {
      totalLearningHours: Math.round(((agg?.totalMinutes ?? 0) / 60) * 10) / 10,
      courseCompletionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
      studentEngagement: total === 0 ? 0 : Math.round(((agg?.engaged ?? 0) / total) * 100),
      byDepartment: [] as Array<{
        departmentId: string | null;
        label: string;
        averageProgress: number;
        count: number;
      }>,
      byProgram: [] as Array<{
        programId: string | null;
        label: string;
        averageProgress: number;
        count: number;
      }>,
      mostActiveCourses: byCourse.map((c) => ({
        courseId: String(c._id),
        title: String(c._id),
        hours: Math.round((c.hours ?? 0) * 10) / 10,
        averageProgress: Math.round(c.averageProgress ?? 0),
      })),
      progressTrend: [] as Array<{ date: string; averageProgress: number; hours: number }>,
      weeklyActivity: [] as Array<{ week: string; events: number; hours: number }>,
    };
  }
}

export const progressRepository = new ProgressRepository();
