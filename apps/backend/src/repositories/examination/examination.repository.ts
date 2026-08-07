import { Types } from 'mongoose';
import type { ExamListQuery } from '@learnova/validation';
import { buildQuestionStatRow, computePassRate } from '@learnova/shared';
import { ExamModel, type ExamDocument } from '../../models/exam.model.js';
import { ExamSectionModel, type ExamSectionDocument } from '../../models/exam-section.model.js';
import { ExamSeatingModel, type ExamSeatingDocument } from '../../models/exam-seating.model.js';
import { ExamAttemptModel, type ExamAttemptDocument } from '../../models/exam-attempt.model.js';
import { ExamAnswerModel, type ExamAnswerDocument } from '../../models/exam-answer.model.js';
import { ExamResultModel, type ExamResultDocument } from '../../models/exam-result.model.js';
import {
  ExamProctorSessionModel,
  type ExamProctorSessionDocument,
} from '../../models/exam-proctor-session.model.js';
import {
  ExamProctorEventModel,
  type ExamProctorEventDocument,
} from '../../models/exam-proctor-event.model.js';
import { ExamAuditLogModel, type ExamAuditEvent } from '../../models/exam-audit-log.model.js';
import { ExamViolationModel, type ExamViolationDocument } from '../../models/exam-violation.model.js';
import { ExamAttendanceModel, type ExamAttendanceDocument } from '../../models/exam-attendance.model.js';
import { ExamPolicyModel, type ExamPolicyDocument } from '../../models/exam-policy.model.js';
import { ExamDeviceModel, type ExamDeviceDocument } from '../../models/exam-device.model.js';
import { ExamRoomModel, type ExamRoomDocument } from '../../models/exam-room.model.js';
import { ExamBlueprintModel, type ExamBlueprintDocument } from '../../models/exam-blueprint.model.js';
import { ExamTemplateModel, type ExamTemplateDocument } from '../../models/exam-template.model.js';
import {
  ExamInvigilatorModel,
  type ExamInvigilatorDocument,
} from '../../models/exam-invigilator.model.js';
import {
  ExamIncidentModel,
  type ExamIncidentDocument,
} from '../../models/exam-incident.model.js';
import {
  ExamAccessibilityModel,
  type ExamAccessibilityDocument,
} from '../../models/exam-accessibility.model.js';
import { ExamVersionModel, type ExamVersionDocument } from '../../models/exam-version.model.js';
import { QuestionModel, type QuestionDocument } from '../../models/question.model.js';

export interface ExamListResult {
  items: ExamDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface AttemptListResult {
  items: ExamAttemptDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface ExamAnalyticsRow {
  questionId: string;
  title: string;
  accuracy: number;
  averageTimeSeconds: number;
  difficulty: string;
  incorrectRate: number;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

export class ExaminationRepository {
  buildExamFilter(
    institutionId: string,
    query: Partial<ExamListQuery>,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };

    if (query.courseId) filter.courseId = toObjectId(query.courseId);
    if (query.status) filter.status = query.status;
    if (query.examType) filter.examType = query.examType;
    if (query.published === true) {
      filter.status = { $in: ['published', 'in_progress', 'completed'] };
    } else if (query.published === false) {
      filter.status = { $nin: ['published', 'in_progress', 'completed'] };
    }
    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    return filter;
  }

  async listExams(
    filter: Record<string, unknown>,
    query: Pick<ExamListQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>,
  ): Promise<ExamListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortField =
      query.sortBy === 'startsAt'
        ? 'schedule.startsAt'
        : query.sortBy === 'endsAt'
          ? 'schedule.endsAt'
          : (query.sortBy ?? 'createdAt');
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      ExamModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ExamModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findExamById(institutionId: string, id: string): Promise<ExamDocument | null> {
    return ExamModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async findExamBySlug(institutionId: string, slug: string): Promise<ExamDocument | null> {
    return ExamModel.findOne({
      institutionId: toObjectId(institutionId),
      slug,
      deletedAt: null,
    }).exec();
  }

  async findExamsByIds(institutionId: string, ids: string[]): Promise<ExamDocument[]> {
    return ExamModel.find({
      _id: { $in: ids.map(toObjectId) },
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createExam(data: Record<string, unknown>): Promise<ExamDocument> {
    return ExamModel.create(data);
  }

  async updateExamById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<ExamDocument | null> {
    return ExamModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteExam(institutionId: string, id: string): Promise<ExamDocument | null> {
    return ExamModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  async bulkUpdateExamStatus(
    institutionId: string,
    ids: string[],
    status: string,
  ): Promise<number> {
    const res = await ExamModel.updateMany(
      {
        _id: { $in: ids.map(toObjectId) },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set: { status } },
    ).exec();
    return res.modifiedCount;
  }

  async bulkSoftDeleteExams(institutionId: string, ids: string[]): Promise<number> {
    const res = await ExamModel.updateMany(
      {
        _id: { $in: ids.map(toObjectId) },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set: { deletedAt: new Date() } },
    ).exec();
    return res.modifiedCount;
  }

  // ---------------------------------------------------------------- sections

  async listSectionsByExam(
    institutionId: string,
    examId: string,
  ): Promise<ExamSectionDocument[]> {
    return ExamSectionModel.find({
      institutionId: toObjectId(institutionId),
      examId: toObjectId(examId),
      deletedAt: null,
    })
      .sort({ displayOrder: 1 })
      .exec();
  }

  async createSection(data: Record<string, unknown>): Promise<ExamSectionDocument> {
    return ExamSectionModel.create(data);
  }

  async softDeleteSectionsByExam(institutionId: string, examId: string): Promise<number> {
    const res = await ExamSectionModel.updateMany(
      {
        institutionId: toObjectId(institutionId),
        examId: toObjectId(examId),
        deletedAt: null,
      },
      { $set: { deletedAt: new Date() } },
    ).exec();
    return res.modifiedCount;
  }

  // ---------------------------------------------------------------- seating

  async findSeating(
    institutionId: string,
    examId: string,
    studentId: string,
  ): Promise<ExamSeatingDocument | null> {
    return ExamSeatingModel.findOne({
      institutionId: toObjectId(institutionId),
      examId: toObjectId(examId),
      studentId: toObjectId(studentId),
    }).exec();
  }

  async listSeatingByExam(institutionId: string, examId: string): Promise<ExamSeatingDocument[]> {
    return ExamSeatingModel.find({
      institutionId: toObjectId(institutionId),
      examId: toObjectId(examId),
    })
      .sort({ seatNumber: 1 })
      .exec();
  }

  async upsertSeating(data: Record<string, unknown>): Promise<ExamSeatingDocument> {
    const institutionId = data.institutionId as Types.ObjectId;
    const examId = data.examId as Types.ObjectId;
    const studentId = data.studentId as Types.ObjectId;
    return ExamSeatingModel.findOneAndUpdate(
      { institutionId, examId, studentId },
      { $set: data },
      { upsert: true, new: true },
    ).exec() as Promise<ExamSeatingDocument>;
  }

  async checkInSeating(
    institutionId: string,
    examId: string,
    studentId: string,
    checkedInAt: Date,
  ): Promise<ExamSeatingDocument | null> {
    return ExamSeatingModel.findOneAndUpdate(
      {
        institutionId: toObjectId(institutionId),
        examId: toObjectId(examId),
        studentId: toObjectId(studentId),
      },
      { $set: { checkedInAt } },
      { new: true },
    ).exec();
  }

  // ---------------------------------------------------------------- questions (reuse quiz Question model)

  async findQuestionsByIds(
    institutionId: string,
    ids: string[],
  ): Promise<QuestionDocument[]> {
    return QuestionModel.find({
      _id: { $in: ids.map(toObjectId) },
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  // ---------------------------------------------------------------- attempts

  async countStudentAttempts(examId: string, studentId: string): Promise<number> {
    return ExamAttemptModel.countDocuments({
      examId: toObjectId(examId),
      studentId: toObjectId(studentId),
      status: { $nin: ['absent'] },
    }).exec();
  }

  async createAttempt(data: Record<string, unknown>): Promise<ExamAttemptDocument> {
    return ExamAttemptModel.create(data);
  }

  async findAttemptById(
    institutionId: string,
    id: string,
  ): Promise<ExamAttemptDocument | null> {
    return ExamAttemptModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
  }

  async updateAttemptById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<ExamAttemptDocument | null> {
    return ExamAttemptModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId) },
      { $set: data },
      { new: true },
    ).exec();
  }

  async incrementViolationCount(
    institutionId: string,
    attemptId: string,
  ): Promise<ExamAttemptDocument | null> {
    return ExamAttemptModel.findOneAndUpdate(
      { _id: attemptId, institutionId: toObjectId(institutionId) },
      { $inc: { violationCount: 1 } },
      { new: true },
    ).exec();
  }

  async listAttempts(
    filter: Record<string, unknown>,
    query: { page?: number; limit?: number },
  ): Promise<AttemptListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await Promise.all([
      ExamAttemptModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ExamAttemptModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  // ---------------------------------------------------------------- answers

  async upsertAnswer(
    institutionId: string,
    attemptId: string,
    questionId: string,
    data: Record<string, unknown>,
  ): Promise<ExamAnswerDocument> {
    return ExamAnswerModel.findOneAndUpdate(
      {
        institutionId: toObjectId(institutionId),
        attemptId: toObjectId(attemptId),
        questionId: toObjectId(questionId),
      },
      { $set: data },
      { upsert: true, new: true },
    ).exec() as Promise<ExamAnswerDocument>;
  }

  async listAnswersByAttempt(attemptId: string): Promise<ExamAnswerDocument[]> {
    return ExamAnswerModel.find({ attemptId: toObjectId(attemptId) }).exec();
  }

  // ---------------------------------------------------------------- results

  async createResult(data: Record<string, unknown>): Promise<ExamResultDocument> {
    return ExamResultModel.create(data);
  }

  async findResultByAttempt(attemptId: string): Promise<ExamResultDocument | null> {
    return ExamResultModel.findOne({ attemptId: toObjectId(attemptId) }).exec();
  }

  // ---------------------------------------------------------------- proctor

  async createProctorSession(
    data: Record<string, unknown>,
  ): Promise<ExamProctorSessionDocument> {
    return ExamProctorSessionModel.create(data);
  }

  async findProctorSessionById(
    institutionId: string,
    id: string,
  ): Promise<ExamProctorSessionDocument | null> {
    return ExamProctorSessionModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
  }

  async closeProctorSession(
    institutionId: string,
    id: string,
    endedAt: Date,
  ): Promise<ExamProctorSessionDocument | null> {
    return ExamProctorSessionModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId) },
      { $set: { status: 'closed', endedAt } },
      { new: true },
    ).exec();
  }

  async createProctorEvent(data: Record<string, unknown>): Promise<ExamProctorEventDocument> {
    return ExamProctorEventModel.create(data);
  }

  async listProctorEventsByAttempt(
    institutionId: string,
    attemptId: string,
  ): Promise<ExamProctorEventDocument[]> {
    return ExamProctorEventModel.find({
      institutionId: toObjectId(institutionId),
      attemptId: toObjectId(attemptId),
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  async countProctorSessions(institutionId: string): Promise<number> {
    return ExamProctorSessionModel.countDocuments({
      institutionId: toObjectId(institutionId),
    }).exec();
  }

  // ---------------------------------------------------------------- audit

  async logAudit(payload: {
    event: ExamAuditEvent;
    institutionId: string;
    examId?: string | null;
    attemptId?: string | null;
    courseId?: string | null;
    userId?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await ExamAuditLogModel.create({
      institutionId: toObjectId(payload.institutionId),
      examId: payload.examId ? toObjectId(payload.examId) : null,
      attemptId: payload.attemptId ? toObjectId(payload.attemptId) : null,
      courseId: payload.courseId ? toObjectId(payload.courseId) : null,
      userId: payload.userId ? toObjectId(payload.userId) : null,
      email: payload.email ?? null,
      event: payload.event,
      metadata: payload.metadata ?? {},
    });
  }

  async listAudit(institutionId: string, examId?: string): Promise<unknown[]> {
    const filter: Record<string, unknown> = { institutionId: toObjectId(institutionId) };
    if (examId) filter.examId = toObjectId(examId);
    return ExamAuditLogModel.find(filter).sort({ createdAt: -1 }).limit(200).exec();
  }

  // ---------------------------------------------------------------- analytics

  async getExamAnalytics(
    institutionId: string,
    examId: string,
  ): Promise<{
    totalAttempts: number;
    averageScore: number | null;
    passRate: number | null;
    averageTimeSeconds: number | null;
    violationCount: number;
    questionStats: ExamAnalyticsRow[];
  }> {
    const oid = toObjectId(institutionId);
    const examOid = toObjectId(examId);
    const attemptBase = { institutionId: oid, examId: examOid };

    const [totalAttempts, avgScoreRows, passRows, avgTimeRows, violationCount, questionStats] =
      await Promise.all([
        ExamAttemptModel.countDocuments({
          ...attemptBase,
          status: { $in: ['submitted', 'completed'] },
        }),
        ExamAttemptModel.aggregate<{ avg: number | null }>([
          {
            $match: {
              ...attemptBase,
              status: { $in: ['submitted', 'completed'] },
            },
          },
          { $group: { _id: null, avg: { $avg: '$percentage' } } },
        ]),
        ExamResultModel.aggregate<{ passed: number; total: number }>([
          { $match: { institutionId: oid, examId: examOid } },
          {
            $group: {
              _id: null,
              passed: { $sum: { $cond: ['$passed', 1, 0] } },
              total: { $sum: 1 },
            },
          },
        ]),
        ExamAttemptModel.aggregate<{ avg: number | null }>([
          {
            $match: {
              ...attemptBase,
              status: { $in: ['submitted', 'completed'] },
            },
          },
          { $group: { _id: null, avg: { $avg: '$timeTakenSeconds' } } },
        ]),
        ExamAttemptModel.aggregate<{ total: number }>([
          { $match: attemptBase },
          { $group: { _id: null, total: { $sum: '$violationCount' } } },
        ]),
        ExamAnswerModel.aggregate<{
          _id: Types.ObjectId;
          total: number;
          correct: number;
          avgTime: number | null;
        }>([
          {
            $lookup: {
              from: 'exam_attempts',
              localField: 'attemptId',
              foreignField: '_id',
              as: 'attempt',
            },
          },
          { $unwind: '$attempt' },
          { $match: { 'attempt.examId': examOid, 'attempt.institutionId': oid } },
          {
            $group: {
              _id: '$questionId',
              total: { $sum: 1 },
              correct: { $sum: { $cond: [{ $eq: ['$isCorrect', true] }, 1, 0] } },
              avgTime: { $avg: '$timeSpentSeconds' },
            },
          },
        ]),
      ]);

    const questionIds = questionStats.map((q) => q._id);
    const questions = await QuestionModel.find({ _id: { $in: questionIds } })
      .select('question difficulty')
      .exec();
    const questionMap = new Map(questions.map((q) => [String(q._id), q]));

    const stats: ExamAnalyticsRow[] = questionStats.map((row) => {
      const q = questionMap.get(String(row._id));
      return buildQuestionStatRow({
        questionId: String(row._id),
        title: q?.question?.slice(0, 80) ?? 'Unknown',
        correct: row.correct,
        total: row.total,
        averageTimeSeconds: row.avgTime ?? 0,
        difficulty: q?.difficulty ?? 'medium',
      });
    });

    const passRow = passRows[0];
    const passRate = passRow ? computePassRate(passRow.passed, passRow.total) : null;

    return {
      totalAttempts,
      averageScore:
        typeof avgScoreRows[0]?.avg === 'number'
          ? Math.round(avgScoreRows[0].avg * 100) / 100
          : null,
      passRate,
      averageTimeSeconds:
        typeof avgTimeRows[0]?.avg === 'number'
          ? Math.round(avgTimeRows[0].avg * 100) / 100
          : null,
      violationCount: violationCount[0]?.total ?? 0,
      questionStats: stats,
    };
  }

  async createViolation(
    data: Omit<ExamViolationDocument, '_id' | 'createdAt'>,
  ): Promise<ExamViolationDocument> {
    return ExamViolationModel.create(data);
  }

  async listViolations(
    institutionId: string,
    examId: string,
    limit = 50,
  ): Promise<ExamViolationDocument[]> {
    return ExamViolationModel.find({
      institutionId: toObjectId(institutionId),
      examId: toObjectId(examId),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async upsertAttendance(
    data: Omit<ExamAttendanceDocument, '_id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ExamAttendanceDocument> {
    return ExamAttendanceModel.findOneAndUpdate(
      {
        institutionId: data.institutionId,
        examId: data.examId,
        studentId: data.studentId,
      },
      { $set: data },
      { upsert: true, new: true },
    ).exec();
  }

  async listAttendance(
    institutionId: string,
    examId: string,
  ): Promise<ExamAttendanceDocument[]> {
    return ExamAttendanceModel.find({
      institutionId: toObjectId(institutionId),
      examId: toObjectId(examId),
    })
      .sort({ checkedInAt: -1 })
      .exec();
  }

  async createDevice(
    data: Omit<ExamDeviceDocument, '_id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ExamDeviceDocument> {
    return ExamDeviceModel.findOneAndUpdate(
      { institutionId: data.institutionId, attemptId: data.attemptId },
      { $set: data },
      { upsert: true, new: true },
    ).exec();
  }

  async listPolicies(institutionId: string): Promise<ExamPolicyDocument[]> {
    return ExamPolicyModel.find({
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    })
      .sort({ name: 1 })
      .exec();
  }

  async createPolicy(
    data: Omit<ExamPolicyDocument, '_id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ExamPolicyDocument> {
    return ExamPolicyModel.create(data);
  }

  async listRooms(institutionId: string, examId: string): Promise<ExamRoomDocument[]> {
    return ExamRoomModel.find({
      institutionId: toObjectId(institutionId),
      examId: toObjectId(examId),
    })
      .sort({ roomCode: 1 })
      .exec();
  }

  async getLiveSnapshot(institutionId: string, examId: string) {
    const examOid = toObjectId(examId);
    const instOid = toObjectId(institutionId);
    const activeStatuses = ['checked_in', 'started'];

    const [attempts, violations, endsAtRow] = await Promise.all([
      ExamAttemptModel.find({
        institutionId: instOid,
        examId: examOid,
      })
        .sort({ updatedAt: -1 })
        .limit(200)
        .exec(),
      ExamViolationModel.find({ institutionId: instOid, examId: examOid })
        .sort({ createdAt: -1 })
        .limit(30)
        .exec(),
      ExamModel.findOne({ _id: examOid, institutionId: instOid }).select('schedule.endsAt status').lean(),
    ]);

    const online = attempts.filter((a) => activeStatuses.includes(a.status)).length;
    const started = attempts.filter((a) => a.status === 'started').length;
    const submitted = attempts.filter((a) =>
      ['submitted', 'completed', 'terminated'].includes(a.status),
    ).length;
    const warnings = attempts.reduce((sum, a) => sum + (a.violationCount ?? 0), 0);

    return {
      endsAt: endsAtRow?.schedule?.endsAt ?? null,
      status: endsAtRow?.status ?? null,
      stats: {
        online,
        started,
        submitted,
        disconnected: attempts.filter((a) => a.status === 'expired').length,
        warnings,
        violations: violations.length,
      },
      attempts,
      recentViolations: violations,
    };
  }

  async createBlueprint(data: Record<string, unknown>): Promise<ExamBlueprintDocument> {
    return ExamBlueprintModel.create(data);
  }

  async listBlueprints(institutionId: string): Promise<ExamBlueprintDocument[]> {
    return ExamBlueprintModel.find({ institutionId: toObjectId(institutionId), deletedAt: null })
      .sort({ name: 1 })
      .exec();
  }

  async findBlueprintById(
    institutionId: string,
    id: string,
  ): Promise<ExamBlueprintDocument | null> {
    return ExamBlueprintModel.findOne({
      _id: toObjectId(id),
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createTemplate(data: Record<string, unknown>): Promise<ExamTemplateDocument> {
    return ExamTemplateModel.create(data);
  }

  async listTemplates(institutionId: string): Promise<ExamTemplateDocument[]> {
    return ExamTemplateModel.find({ institutionId: toObjectId(institutionId), deletedAt: null })
      .sort({ name: 1 })
      .exec();
  }

  async findTemplateById(
    institutionId: string,
    id: string,
  ): Promise<ExamTemplateDocument | null> {
    return ExamTemplateModel.findOne({
      _id: toObjectId(id),
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async upsertInvigilator(data: Record<string, unknown>): Promise<ExamInvigilatorDocument> {
    return ExamInvigilatorModel.findOneAndUpdate(
      {
        institutionId: data.institutionId,
        examId: data.examId,
        userId: data.userId,
      },
      { $set: data },
      { upsert: true, new: true },
    ).exec() as Promise<ExamInvigilatorDocument>;
  }

  async listInvigilators(
    institutionId: string,
    examId: string,
  ): Promise<ExamInvigilatorDocument[]> {
    return ExamInvigilatorModel.find({
      institutionId: toObjectId(institutionId),
      examId: toObjectId(examId),
    }).exec();
  }

  async findInvigilator(
    institutionId: string,
    examId: string,
    userId: string,
  ): Promise<ExamInvigilatorDocument | null> {
    return ExamInvigilatorModel.findOne({
      institutionId: toObjectId(institutionId),
      examId: toObjectId(examId),
      userId: toObjectId(userId),
    }).exec();
  }

  async createIncident(data: Record<string, unknown>): Promise<ExamIncidentDocument> {
    return ExamIncidentModel.create(data);
  }

  async listIncidents(
    institutionId: string,
    examId: string,
    attemptId?: string,
  ): Promise<ExamIncidentDocument[]> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      examId: toObjectId(examId),
    };
    if (attemptId) filter.attemptId = toObjectId(attemptId);
    return ExamIncidentModel.find(filter).sort({ createdAt: 1 }).limit(500).exec();
  }

  async upsertAccessibility(data: Record<string, unknown>): Promise<ExamAccessibilityDocument> {
    return ExamAccessibilityModel.findOneAndUpdate(
      {
        institutionId: data.institutionId,
        examId: data.examId,
        studentId: data.studentId,
      },
      { $set: data },
      { upsert: true, new: true },
    ).exec() as Promise<ExamAccessibilityDocument>;
  }

  async findAccessibility(
    institutionId: string,
    examId: string,
    studentId: string,
  ): Promise<ExamAccessibilityDocument | null> {
    return ExamAccessibilityModel.findOne({
      institutionId: toObjectId(institutionId),
      examId: toObjectId(examId),
      studentId: toObjectId(studentId),
    }).exec();
  }

  async listAccessibility(
    institutionId: string,
    examId: string,
  ): Promise<ExamAccessibilityDocument[]> {
    return ExamAccessibilityModel.find({
      institutionId: toObjectId(institutionId),
      examId: toObjectId(examId),
    }).exec();
  }

  async createExamVersion(data: Record<string, unknown>): Promise<ExamVersionDocument> {
    return ExamVersionModel.create(data);
  }

  async findExamVersionById(
    institutionId: string,
    id: string,
  ): Promise<ExamVersionDocument | null> {
    return ExamVersionModel.findOne({
      _id: toObjectId(id),
      institutionId: toObjectId(institutionId),
    }).exec();
  }

  async listExamVersions(
    institutionId: string,
    examId: string,
  ): Promise<ExamVersionDocument[]> {
    return ExamVersionModel.find({
      institutionId: toObjectId(institutionId),
      examId: toObjectId(examId),
    })
      .sort({ versionNumber: -1 })
      .exec();
  }

  async findAttemptBySessionToken(
    institutionId: string,
    sessionToken: string,
  ): Promise<ExamAttemptDocument | null> {
    return ExamAttemptModel.findOne({
      institutionId: toObjectId(institutionId),
      sessionToken,
    }).exec();
  }
}

export const examinationRepository = new ExaminationRepository();
