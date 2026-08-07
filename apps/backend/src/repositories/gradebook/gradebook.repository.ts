import { Types } from 'mongoose';
import type { GradebookListQuery } from '@learnova/validation';
import { GradebookEntryModel } from '../../models/gradebook-entry.model.js';
import { CourseGradeSummaryModel } from '../../models/course-grade-summary.model.js';
import { GradebookWeightSchemeModel } from '../../models/gradebook-weight-scheme.model.js';
import { GradebookAuditLogModel } from '../../models/gradebook-audit-log.model.js';
import type { IngestDraft } from './gradebook-ingestion.js';
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
    weightedPercentage: number | null;
    letterGrade: string | null;
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
          weightedPercentage: payload.weightedPercentage,
          letterGrade: payload.letterGrade,
          totalMarksEarned: payload.totalMarksEarned,
          totalMarksPossible: payload.totalMarksPossible,
          entryCount: payload.entryCount,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
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
    const [entryCount, finalizedSummaries, avgResult] = await Promise.all([
      GradebookEntryModel.countDocuments({
        institutionId: oid(institutionId),
        courseId: oid(courseId),
        status: { $ne: 'superseded' },
      }).exec(),
      CourseGradeSummaryModel.countDocuments({
        institutionId: oid(institutionId),
        courseId: oid(courseId),
        status: 'finalized',
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
      averageWeightedPercentage: avgResult[0]?.avg ?? 0,
    };
  },
};
