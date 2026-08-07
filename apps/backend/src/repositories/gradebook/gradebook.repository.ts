import { Types } from 'mongoose';
import type { GradebookListQuery } from '@learnova/validation';
import { GradebookEntryModel } from '../../models/gradebook-entry.model.js';
import { CourseGradeSummaryModel } from '../../models/course-grade-summary.model.js';
import { GradebookWeightSchemeModel } from '../../models/gradebook-weight-scheme.model.js';
import { GradebookAuditLogModel } from '../../models/gradebook-audit-log.model.js';
import { GradeAppealModel } from '../../models/grade-appeal.model.js';
import { GradeCommentModel } from '../../models/grade-comment.model.js';
import { GradeHistoryModel } from '../../models/grade-history.model.js';
import { SemesterGradeModel } from '../../models/semester-grade.model.js';
import { CGPARecordModel } from '../../models/cgpa-record.model.js';
import type { IngestDraft } from '../../services/gradebook/gradebook-ingestion.js';
import { oid } from './gradebook.helpers.js';

function buildEntryFilter(
  institutionId: string,
  query: GradebookListQuery,
): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    institutionId: oid(institutionId),
    status: { $ne: 'superseded' },
  };
  if (query.courseId) filter.courseId = oid(query.courseId);
  if (query.studentId) filter.studentId = oid(query.studentId);
  if (query.activityKind) filter.activityKind = query.activityKind;
  if (query.status) filter.status = query.status;
  return filter;
}

export const gradebookRepository = {
  async listEntries(institutionId: string, query: GradebookListQuery) {
    const filter = buildEntryFilter(institutionId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      GradebookEntryModel.find(filter).sort({ consumedAt: -1 }).skip(skip).limit(limit).exec(),
      GradebookEntryModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  },

  async upsertEntry(draft: IngestDraft, weightage: number) {
    const now = new Date();
    return GradebookEntryModel.findOneAndUpdate(
      {
        institutionId: draft.institutionId,
        sourceCollection: draft.sourceCollection,
        sourceRefId: draft.sourceRefId,
      },
      {
        $set: {
          courseId: draft.courseId,
          studentId: draft.studentId,
          enrollmentId: draft.enrollmentId,
          activityKind: draft.activityKind,
          activityId: draft.activityId,
          activityTitle: draft.activityTitle,
          gradingMethod: draft.gradingMethod,
          marksObtained: draft.marksObtained,
          totalMarks: draft.totalMarks,
          percentage: draft.percentage,
          passed: draft.passed,
          weightage,
          status: draft.status,
          consumedAt: now,
          gradedAt: draft.gradedAt,
          gradedBy: draft.gradedBy,
          metadata: draft.metadata,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  },

  async listEntriesForStudentCourse(
    institutionId: string,
    courseId: string,
    studentId: string,
  ) {
    return GradebookEntryModel.find({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      studentId: oid(studentId),
      status: { $ne: 'superseded' },
    })
      .sort({ activityKind: 1, activityTitle: 1 })
      .exec();
  },

  async listSummariesForCourse(institutionId: string, courseId: string, studentId?: string) {
    const filter: Record<string, unknown> = {
      institutionId: oid(institutionId),
      courseId: oid(courseId),
    };
    if (studentId) filter.studentId = oid(studentId);
    return CourseGradeSummaryModel.find(filter).sort({ weightedPercentage: -1 }).exec();
  },

  async upsertSummary(payload: {
    institutionId: Types.ObjectId;
    courseId: Types.ObjectId;
    studentId: Types.ObjectId;
    enrollmentId: Types.ObjectId | null;
    semesterId?: Types.ObjectId | null;
    facultyId?: Types.ObjectId | null;
    weightedPercentage: number | null;
    finalMarks?: number | null;
    percentage?: number | null;
    letterGrade: string | null;
    gradePoints?: number | null;
    result?: string | null;
    totalMarksEarned: number;
    totalMarksPossible: number;
    entryCount: number;
  }) {
    return CourseGradeSummaryModel.findOneAndUpdate(
      {
        institutionId: payload.institutionId,
        courseId: payload.courseId,
        studentId: payload.studentId,
      },
      {
        $set: {
          enrollmentId: payload.enrollmentId,
          semesterId: payload.semesterId ?? null,
          facultyId: payload.facultyId ?? null,
          weightedPercentage: payload.weightedPercentage,
          finalMarks: payload.finalMarks ?? payload.totalMarksEarned,
          percentage: payload.percentage ?? payload.weightedPercentage,
          letterGrade: payload.letterGrade,
          gradePoints: payload.gradePoints ?? null,
          result: payload.result ?? null,
          totalMarksEarned: payload.totalMarksEarned,
          totalMarksPossible: payload.totalMarksPossible,
          entryCount: payload.entryCount,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  },

  async getSummary(institutionId: string, courseId: string, studentId: string) {
    return CourseGradeSummaryModel.findOne({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      studentId: oid(studentId),
    }).exec();
  },

  async isStudentLocked(institutionId: string, courseId: string, studentId: string) {
    const summary = await CourseGradeSummaryModel.findOne({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      studentId: oid(studentId),
      locked: true,
    })
      .select('locked')
      .lean()
      .exec();
    return Boolean(summary?.locked);
  },

  async recordHistory(payload: {
    institutionId: string;
    courseGradeId: string;
    courseId: string;
    studentId: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
    reason?: string;
    changedBy?: string;
  }) {
    return GradeHistoryModel.create({
      institutionId: oid(payload.institutionId),
      courseGradeId: oid(payload.courseGradeId),
      courseId: oid(payload.courseId),
      studentId: oid(payload.studentId),
      field: payload.field,
      oldValue: payload.oldValue,
      newValue: payload.newValue,
      reason: payload.reason ?? null,
      changedBy: payload.changedBy ? oid(payload.changedBy) : null,
    });
  },

  async listHistory(institutionId: string, courseGradeId: string) {
    return GradeHistoryModel.find({
      institutionId: oid(institutionId),
      courseGradeId: oid(courseGradeId),
    })
      .sort({ createdAt: -1 })
      .exec();
  },

  async createAppeal(payload: {
    institutionId: string;
    courseGradeId: string;
    courseId: string;
    studentId: string;
    reason: string;
  }) {
    return GradeAppealModel.create({
      institutionId: oid(payload.institutionId),
      courseGradeId: oid(payload.courseGradeId),
      courseId: oid(payload.courseId),
      studentId: oid(payload.studentId),
      reason: payload.reason,
      status: 'pending',
      submittedAt: new Date(),
    });
  },

  async resolveAppeal(
    institutionId: string,
    appealId: string,
    status: 'accepted' | 'rejected',
    reviewedBy: string,
    resolutionNotes?: string,
  ) {
    return GradeAppealModel.findOneAndUpdate(
      { _id: oid(appealId), institutionId: oid(institutionId) },
      {
        $set: {
          status,
          reviewedBy: oid(reviewedBy),
          reviewedAt: new Date(),
          resolutionNotes: resolutionNotes ?? null,
        },
      },
      { new: true },
    ).exec();
  },

  async listAppeals(
    institutionId: string,
    filters: { courseId?: string; studentId?: string; status?: string },
  ) {
    const query: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (filters.courseId) query.courseId = oid(filters.courseId);
    if (filters.studentId) query.studentId = oid(filters.studentId);
    if (filters.status) query.status = filters.status;
    return GradeAppealModel.find(query).sort({ submittedAt: -1 }).exec();
  },

  async countPendingAppeals(institutionId: string, courseId?: string) {
    const filter: Record<string, unknown> = {
      institutionId: oid(institutionId),
      status: { $in: ['pending', 'under_review'] },
    };
    if (courseId) filter.courseId = oid(courseId);
    return GradeAppealModel.countDocuments(filter).exec();
  },

  async createComment(payload: {
    institutionId: string;
    courseGradeId?: string;
    gradebookEntryId?: string;
    courseId: string;
    studentId: string;
    authorId: string;
    visibility: string;
    body: string;
  }) {
    return GradeCommentModel.create({
      institutionId: oid(payload.institutionId),
      courseGradeId: payload.courseGradeId ? oid(payload.courseGradeId) : null,
      gradebookEntryId: payload.gradebookEntryId ? oid(payload.gradebookEntryId) : null,
      courseId: oid(payload.courseId),
      studentId: oid(payload.studentId),
      authorId: oid(payload.authorId),
      visibility: payload.visibility,
      body: payload.body,
    });
  },

  async listComments(
    institutionId: string,
    filters: { courseId?: string; studentId?: string; courseGradeId?: string },
  ) {
    const query: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (filters.courseId) query.courseId = oid(filters.courseId);
    if (filters.studentId) query.studentId = oid(filters.studentId);
    if (filters.courseGradeId) query.courseGradeId = oid(filters.courseGradeId);
    return GradeCommentModel.find(query).sort({ createdAt: -1 }).exec();
  },

  async upsertSemesterGrade(payload: {
    institutionId: Types.ObjectId;
    studentId: Types.ObjectId;
    semesterId: Types.ObjectId;
    programId: Types.ObjectId | null;
    semesterGpa: number | null;
    totalCredits: number;
    earnedCredits: number;
    courseCount: number;
  }) {
    return SemesterGradeModel.findOneAndUpdate(
      {
        institutionId: payload.institutionId,
        studentId: payload.studentId,
        semesterId: payload.semesterId,
      },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  },

  async listSemesterGrades(institutionId: string, studentId?: string, semesterId?: string) {
    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (studentId) filter.studentId = oid(studentId);
    if (semesterId) filter.semesterId = oid(semesterId);
    return SemesterGradeModel.find(filter).sort({ updatedAt: -1 }).exec();
  },

  async upsertCgpaRecord(payload: {
    institutionId: Types.ObjectId;
    studentId: Types.ObjectId;
    programId: Types.ObjectId | null;
    cgpa: number | null;
    totalCredits: number;
    completedCredits: number;
  }) {
    return CGPARecordModel.findOneAndUpdate(
      {
        institutionId: payload.institutionId,
        studentId: payload.studentId,
        programId: payload.programId,
      },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  },

  async getCgpaRecord(institutionId: string, studentId: string, programId?: string) {
    const filter: Record<string, unknown> = {
      institutionId: oid(institutionId),
      studentId: oid(studentId),
    };
    if (programId) filter.programId = oid(programId);
    return CGPARecordModel.findOne(filter).exec();
  },

  async updateSummariesBulk(
    institutionId: string,
    courseId: string,
    studentIds: string[] | undefined,
    update: Record<string, unknown>,
  ) {
    const filter: Record<string, unknown> = {
      institutionId: oid(institutionId),
      courseId: oid(courseId),
    };
    if (studentIds?.length) filter.studentId = { $in: studentIds.map(oid) };
    await CourseGradeSummaryModel.updateMany(filter, { $set: update }).exec();
    return CourseGradeSummaryModel.find(filter).exec();
  },

  async getWeightScheme(institutionId: string, courseId: string) {
    return GradebookWeightSchemeModel.findOne({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
    }).exec();
  },

  async upsertWeightScheme(
    institutionId: string,
    courseId: string,
    payload: Record<string, unknown>,
    actorId: string,
  ) {
    return GradebookWeightSchemeModel.findOneAndUpdate(
      { institutionId: oid(institutionId), courseId: oid(courseId) },
      { $set: { ...payload, updatedBy: oid(actorId) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  },

  async finalizeSummaries(institutionId: string, courseId: string, actorId: string) {
    const now = new Date();
    await CourseGradeSummaryModel.updateMany(
      {
        institutionId: oid(institutionId),
        courseId: oid(courseId),
        status: 'draft',
      },
      { $set: { status: 'finalized', finalizedAt: now, finalizedBy: oid(actorId) } },
    ).exec();
    return CourseGradeSummaryModel.find({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      status: 'finalized',
    }).exec();
  },

  async appendAudit(payload: {
    institutionId: string;
    courseId?: string;
    studentId?: string;
    event: string;
    actorId?: string;
    details?: Record<string, unknown>;
  }) {
    return GradebookAuditLogModel.create({
      institutionId: oid(payload.institutionId),
      courseId: payload.courseId ? oid(payload.courseId) : null,
      studentId: payload.studentId ? oid(payload.studentId) : null,
      event: payload.event,
      actorId: payload.actorId ? oid(payload.actorId) : null,
      payload: payload.details ?? {},
    });
  },

  async countEntries(institutionId: string, courseId?: string) {
    const filter: Record<string, unknown> = {
      institutionId: oid(institutionId),
      status: { $ne: 'superseded' },
    };
    if (courseId) filter.courseId = oid(courseId);
    return GradebookEntryModel.countDocuments(filter).exec();
  },

  async aggregateCourseStats(institutionId: string, courseId: string) {
    const [entryCount, finalizedSummaries, publishedSummaries, lockedSummaries, avgResult] =
      await Promise.all([
      GradebookEntryModel.countDocuments({
        institutionId: oid(institutionId),
        courseId: oid(courseId),
        status: { $ne: 'superseded' },
      }).exec(),
      CourseGradeSummaryModel.countDocuments({
        institutionId: oid(institutionId),
        courseId: oid(courseId),
        status: { $in: ['finalized', 'published'] },
      }).exec(),
      CourseGradeSummaryModel.countDocuments({
        institutionId: oid(institutionId),
        courseId: oid(courseId),
        published: true,
      }).exec(),
      CourseGradeSummaryModel.countDocuments({
        institutionId: oid(institutionId),
        courseId: oid(courseId),
        locked: true,
      }).exec(),
      CourseGradeSummaryModel.aggregate<{ avg: number | null }>([
        {
          $match: {
            institutionId: oid(institutionId),
            courseId: oid(courseId),
            weightedPercentage: { $ne: null },
          },
        },
        { $group: { _id: null, avg: { $avg: '$weightedPercentage' } } },
      ]).exec(),
    ]);

    return {
      entryCount,
      finalizedSummaries,
      publishedSummaries,
      lockedSummaries,
      averageWeightedPercentage: avgResult[0]?.avg ?? 0,
    };
  },
};
