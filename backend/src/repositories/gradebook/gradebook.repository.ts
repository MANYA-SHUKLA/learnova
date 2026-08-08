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
import { GradebookAcademicPolicyModel } from '../../models/gradebook-academic-policy.model.js';
import { GradeModerationRecordModel } from '../../models/grade-moderation-record.model.js';
import { GradebookSnapshotModel } from '../../models/gradebook-snapshot.model.js';
import { AcademicStandingModel } from '../../models/academic-standing.model.js';
import { TranscriptRequestModel } from '../../models/transcript-request.model.js';
import { CourseModel } from '../../models/course.model.js';
import { ProjectSubmissionModel } from '../../models/project-submission.model.js';
import type { IngestDraft } from '../../services/gradebook/gradebook-ingestion.js';
import { oid } from '../../services/gradebook/gradebook.helpers.js';

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
        locked: { $ne: true },
      },
      {
        $set: {
          status: 'published',
          locked: true,
          published: true,
          publishedAt: now,
          finalizedAt: now,
          finalizedBy: oid(actorId),
          lockedAt: now,
          lockedBy: oid(actorId),
        },
      },
    ).exec();
    return CourseGradeSummaryModel.find({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      status: 'published',
      locked: true,
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

  async aggregateInstitutionStats(institutionId: string) {
    const instOid = oid(institutionId);
    const [entryCount, summaryAgg, courseCount, pendingProjectGrades] = await Promise.all([
      GradebookEntryModel.countDocuments({
        institutionId: instOid,
        status: { $ne: 'superseded' },
      }).exec(),
      CourseGradeSummaryModel.aggregate<{
        finalizedSummaries: number;
        avgWeighted: number | null;
      }>([
        { $match: { institutionId: instOid } },
        {
          $group: {
            _id: null,
            finalizedSummaries: {
              $sum: {
                $cond: [{ $in: ['$status', ['finalized', 'published']] }, 1, 0],
              },
            },
            avgWeighted: { $avg: '$weightedPercentage' },
          },
        },
      ]).exec(),
      CourseModel.countDocuments({ institutionId: instOid, deletedAt: null }).exec(),
      ProjectSubmissionModel.countDocuments({
        institutionId: instOid,
        evaluationStatus: 'ready',
        deletedAt: null,
      }).exec(),
    ]);

    const agg = summaryAgg[0];
    return {
      courseCount,
      entryCount,
      finalizedSummaries: agg?.finalizedSummaries ?? 0,
      pendingProjectGrades,
      averageWeightedPercentage: agg?.avgWeighted ?? 0,
    };
  },

  async listEntriesForStudents(
    institutionId: string,
    courseId: string,
    studentIds: string[],
  ) {
    if (studentIds.length === 0) return [];
    return GradebookEntryModel.find({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      studentId: { $in: studentIds.map((id) => oid(id)) },
      status: { $ne: 'superseded' },
    })
      .lean()
      .exec();
  },

  async getAcademicPolicy(institutionId: string) {
    return GradebookAcademicPolicyModel.findOne({ institutionId: oid(institutionId) }).exec();
  },

  async upsertAcademicPolicy(institutionId: string, payload: Record<string, unknown>) {
    return GradebookAcademicPolicyModel.findOneAndUpdate(
      { institutionId: oid(institutionId) },
      { $set: { ...payload, institutionId: oid(institutionId) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  },

  async createModerationRecord(payload: {
    institutionId: string;
    courseId: string;
    courseGradeId?: string | null;
    studentId?: string | null;
    stage: string;
    actorId?: string | null;
    actorRole?: string | null;
    notes?: string | null;
  }) {
    return GradeModerationRecordModel.create({
      institutionId: oid(payload.institutionId),
      courseId: oid(payload.courseId),
      courseGradeId: payload.courseGradeId ? oid(payload.courseGradeId) : null,
      studentId: payload.studentId ? oid(payload.studentId) : null,
      stage: payload.stage,
      actorId: payload.actorId ? oid(payload.actorId) : null,
      actorRole: payload.actorRole ?? null,
      notes: payload.notes ?? null,
    });
  },

  async createModerationRecords(
    records: Array<{
      institutionId: string;
      courseId: string;
      courseGradeId?: string | null;
      studentId?: string | null;
      stage: string;
      actorId?: string | null;
      actorRole?: string | null;
      notes?: string | null;
    }>,
  ) {
    if (records.length === 0) return [];
    return GradeModerationRecordModel.insertMany(
      records.map((payload) => ({
        institutionId: oid(payload.institutionId),
        courseId: oid(payload.courseId),
        courseGradeId: payload.courseGradeId ? oid(payload.courseGradeId) : null,
        studentId: payload.studentId ? oid(payload.studentId) : null,
        stage: payload.stage,
        actorId: payload.actorId ? oid(payload.actorId) : null,
        actorRole: payload.actorRole ?? null,
        notes: payload.notes ?? null,
      })),
    );
  },

  async listModerationRecords(institutionId: string, courseId: string, studentId?: string) {
    const filter: Record<string, unknown> = {
      institutionId: oid(institutionId),
      courseId: oid(courseId),
    };
    if (studentId) filter.studentId = oid(studentId);
    return GradeModerationRecordModel.find(filter).sort({ createdAt: -1 }).exec();
  },

  async createSnapshot(payload: {
    institutionId: string;
    courseId: string;
    studentId: string;
    courseGradeId: string;
    version: number;
    summary: Record<string, unknown>;
    entries: Array<Record<string, unknown>>;
    frozenAt: Date;
    frozenBy?: string | null;
  }) {
    return GradebookSnapshotModel.create({
      institutionId: oid(payload.institutionId),
      courseId: oid(payload.courseId),
      studentId: oid(payload.studentId),
      courseGradeId: oid(payload.courseGradeId),
      version: payload.version,
      summary: payload.summary,
      entries: payload.entries,
      frozenAt: payload.frozenAt,
      frozenBy: payload.frozenBy ? oid(payload.frozenBy) : null,
      immutable: true,
    });
  },

  async listSnapshots(institutionId: string, courseId: string, studentId?: string) {
    const filter: Record<string, unknown> = {
      institutionId: oid(institutionId),
      courseId: oid(courseId),
    };
    if (studentId) filter.studentId = oid(studentId);
    return GradebookSnapshotModel.find(filter).sort({ version: -1 }).exec();
  },

  async getSnapshot(
    institutionId: string,
    courseId: string,
    studentId: string,
    version: number,
  ) {
    return GradebookSnapshotModel.findOne({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      studentId: oid(studentId),
      version,
    }).exec();
  },

  async upsertAcademicStanding(payload: {
    institutionId: Types.ObjectId;
    studentId: Types.ObjectId;
    semesterId: Types.ObjectId | null;
    programId: Types.ObjectId | null;
    standing: string;
    semesterGpa: number | null;
    cgpa: number | null;
    failedCourseCount: number;
    publishedCourseCount: number;
    computedAt: Date;
  }) {
    const filter: Record<string, unknown> = {
      institutionId: payload.institutionId,
      studentId: payload.studentId,
    };
    if (payload.semesterId) {
      filter.semesterId = payload.semesterId;
    } else {
      filter.semesterId = null;
    }

    return AcademicStandingModel.findOneAndUpdate(
      filter,
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  },

  async listAcademicStandings(institutionId: string, studentId?: string, semesterId?: string) {
    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (studentId) filter.studentId = oid(studentId);
    if (semesterId) filter.semesterId = oid(semesterId);
    return AcademicStandingModel.find(filter).sort({ computedAt: -1 }).exec();
  },

  async listSummariesForCourseWithFilter(
    institutionId: string,
    courseId: string,
    studentIds?: string[],
  ) {
    const filter: Record<string, unknown> = {
      institutionId: oid(institutionId),
      courseId: oid(courseId),
    };
    if (studentIds?.length) filter.studentId = { $in: studentIds.map(oid) };
    return CourseGradeSummaryModel.find(filter).exec();
  },

  async createTranscriptRequest(payload: {
    institutionId: string;
    studentId: string;
    semesterId?: string | null;
    requestType: string;
    reason?: string | null;
  }) {
    return TranscriptRequestModel.create({
      institutionId: oid(payload.institutionId),
      studentId: oid(payload.studentId),
      semesterId: payload.semesterId ? oid(payload.semesterId) : null,
      requestType: payload.requestType,
      reason: payload.reason ?? null,
      status: 'pending',
      requestedAt: new Date(),
    });
  },

  async listTranscriptRequests(
    institutionId: string,
    filters: { studentId?: string; status?: string } = {},
  ) {
    const query: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (filters.studentId) query.studentId = oid(filters.studentId);
    if (filters.status) query.status = filters.status;
    return TranscriptRequestModel.find(query).sort({ requestedAt: -1 }).limit(200).exec();
  },

  async reviewTranscriptRequest(
    institutionId: string,
    requestId: string,
    payload: {
      status: 'approved' | 'rejected' | 'completed';
      reviewedBy: string;
      reviewNotes?: string | null;
      transcriptId?: string | null;
    },
  ) {
    const updates: Record<string, unknown> = {
      status: payload.status,
      reviewedBy: oid(payload.reviewedBy),
      reviewedAt: new Date(),
      reviewNotes: payload.reviewNotes ?? null,
    };
    if (payload.status === 'completed') {
      updates.completedAt = new Date();
      if (payload.transcriptId) updates.transcriptId = oid(payload.transcriptId);
    }
    return TranscriptRequestModel.findOneAndUpdate(
      { _id: oid(requestId), institutionId: oid(institutionId) },
      { $set: updates },
      { new: true },
    ).exec();
  },
};
