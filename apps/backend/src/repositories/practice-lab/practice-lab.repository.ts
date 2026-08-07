import { Types } from 'mongoose';
import type {
  ExecutionHistoryQuery,
  PracticeLabListQuery,
  ProblemListQuery,
  SubmissionListQuery,
} from '@learnova/validation';
import type { PracticeLabAuditEvent } from '@learnova/constants';
import { PracticeLabModel, type PracticeLabDocument } from '../../models/practice-lab.model.js';
import { LabProblemModel, type LabProblemDocument } from '../../models/lab-problem.model.js';
import {
  ProblemTestCaseModel,
  type ProblemTestCaseDocument,
} from '../../models/problem-test-case.model.js';
import {
  StudentCodeSubmissionModel,
  type StudentCodeSubmissionDocument,
} from '../../models/student-code-submission.model.js';
import {
  ExecutionHistoryModel,
  type ExecutionHistoryDocument,
} from '../../models/execution-history.model.js';
import { LabProgressModel, type LabProgressDocument } from '../../models/lab-progress.model.js';
import { LanguageModel, type LanguageDocument } from '../../models/language.model.js';
import { PracticeLabAuditLogModel } from '../../models/practice-lab-audit-log.model.js';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

export class PracticeLabRepository {
  buildLabFilter(
    institutionId: string,
    query: Partial<PracticeLabListQuery>,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };
    if (query.courseId) filter.courseId = toObjectId(query.courseId);
    if (query.moduleId) filter.moduleId = toObjectId(query.moduleId);
    if (query.lessonId) filter.lessonId = toObjectId(query.lessonId);
    if (query.status) filter.status = query.status;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.language) filter.languages = query.language;
    if (query.createdBy) filter.createdBy = toObjectId(query.createdBy);
    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }
    return filter;
  }

  async listLabs(
    filter: Record<string, unknown>,
    query: Pick<PracticeLabListQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;
    const [items, total] = await Promise.all([
      PracticeLabModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      PracticeLabModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  async findLabById(institutionId: string, id: string): Promise<PracticeLabDocument | null> {
    return PracticeLabModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createLab(data: Record<string, unknown>): Promise<PracticeLabDocument> {
    return PracticeLabModel.create(data);
  }

  async updateLab(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<PracticeLabDocument | null> {
    return PracticeLabModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteLab(institutionId: string, id: string, updatedBy: string | null) {
    return PracticeLabModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date(), updatedBy } },
      { new: true },
    ).exec();
  }

  async incrementProblemCount(labId: string, delta: number) {
    await PracticeLabModel.updateOne({ _id: labId }, { $inc: { problemCount: delta } }).exec();
  }

  buildProblemFilter(
    institutionId: string,
    query: Partial<ProblemListQuery>,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };
    if (query.practiceLabId) filter.practiceLabId = toObjectId(query.practiceLabId);
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.tag) filter.tags = query.tag;
    if (query.language) filter.allowedLanguages = query.language;
    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ title: regex }, { description: regex }, { problemStatement: regex }];
    }
    return filter;
  }

  async listProblems(
    filter: Record<string, unknown>,
    query: Pick<ProblemListQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortField = query.sortBy ?? 'order';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;
    const [items, total] = await Promise.all([
      LabProblemModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      LabProblemModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  async findProblemById(institutionId: string, id: string): Promise<LabProblemDocument | null> {
    return LabProblemModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createProblem(data: Record<string, unknown>): Promise<LabProblemDocument> {
    return LabProblemModel.create(data);
  }

  async updateProblem(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<LabProblemDocument | null> {
    return LabProblemModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteProblem(institutionId: string, id: string, updatedBy: string | null) {
    return LabProblemModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date(), updatedBy } },
      { new: true },
    ).exec();
  }

  async listTestCases(problemId: string, visibility?: 'public' | 'hidden' | 'all') {
    const filter: Record<string, unknown> = {
      problemId: toObjectId(problemId),
      deletedAt: null,
    };
    if (visibility && visibility !== 'all') filter.visibility = visibility;
    return ProblemTestCaseModel.find(filter).sort({ order: 1, createdAt: 1 }).exec();
  }

  async findTestCaseById(
    institutionId: string,
    id: string,
  ): Promise<ProblemTestCaseDocument | null> {
    return ProblemTestCaseModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createTestCase(data: Record<string, unknown>): Promise<ProblemTestCaseDocument> {
    return ProblemTestCaseModel.create(data);
  }

  async createTestCases(data: Record<string, unknown>[]): Promise<ProblemTestCaseDocument[]> {
    return ProblemTestCaseModel.insertMany(data);
  }

  async updateTestCase(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<ProblemTestCaseDocument | null> {
    return ProblemTestCaseModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteTestCase(institutionId: string, id: string) {
    return ProblemTestCaseModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  async createSubmission(
    data: Record<string, unknown>,
  ): Promise<StudentCodeSubmissionDocument> {
    return StudentCodeSubmissionModel.create(data);
  }

  async updateSubmission(
    id: string,
    data: Record<string, unknown>,
  ): Promise<StudentCodeSubmissionDocument | null> {
    return StudentCodeSubmissionModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async findSubmissionById(
    institutionId: string,
    id: string,
  ): Promise<StudentCodeSubmissionDocument | null> {
    return StudentCodeSubmissionModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async countSubmissionsForProblem(studentId: string, problemId: string): Promise<number> {
    return StudentCodeSubmissionModel.countDocuments({
      studentId: toObjectId(studentId),
      problemId: toObjectId(problemId),
      deletedAt: null,
    }).exec();
  }

  async listSubmissions(
    filter: Record<string, unknown>,
    query: Pick<SubmissionListQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;
    const [items, total] = await Promise.all([
      StudentCodeSubmissionModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      StudentCodeSubmissionModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  buildSubmissionFilter(
    institutionId: string,
    query: Partial<SubmissionListQuery>,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };
    if (query.practiceLabId) filter.practiceLabId = toObjectId(query.practiceLabId);
    if (query.problemId) filter.problemId = toObjectId(query.problemId);
    if (query.studentId) filter.studentId = toObjectId(query.studentId);
    if (query.language) filter.language = query.language;
    if (query.verdict) filter.verdict = query.verdict;
    return filter;
  }

  async createExecution(data: Record<string, unknown>): Promise<ExecutionHistoryDocument> {
    return ExecutionHistoryModel.create(data);
  }

  async updateExecution(
    id: string,
    data: Record<string, unknown>,
  ): Promise<ExecutionHistoryDocument | null> {
    return ExecutionHistoryModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async findExecutionById(
    institutionId: string,
    id: string,
  ): Promise<ExecutionHistoryDocument | null> {
    return ExecutionHistoryModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
  }

  async listExecutions(
    institutionId: string,
    query: Partial<ExecutionHistoryQuery> & { page?: number; limit?: number },
  ) {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
    };
    if (query.practiceLabId) filter.practiceLabId = toObjectId(query.practiceLabId);
    if (query.problemId) filter.problemId = toObjectId(query.problemId);
    if (query.studentId) filter.studentId = toObjectId(query.studentId);
    if (query.language) filter.language = query.language;
    if (query.isSubmission !== undefined) filter.isSubmission = query.isSubmission;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await Promise.all([
      ExecutionHistoryModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ExecutionHistoryModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  async upsertProgress(
    institutionId: string,
    practiceLabId: string,
    studentId: string,
    update: Record<string, unknown>,
  ): Promise<LabProgressDocument> {
    return LabProgressModel.findOneAndUpdate(
      {
        institutionId: toObjectId(institutionId),
        practiceLabId: toObjectId(practiceLabId),
        studentId: toObjectId(studentId),
      },
      { $setOnInsert: { institutionId, practiceLabId, studentId }, $set: update, $inc: {} },
      { upsert: true, new: true },
    ).exec() as Promise<LabProgressDocument>;
  }

  async findProgress(
    institutionId: string,
    practiceLabId: string,
    studentId: string,
  ): Promise<LabProgressDocument | null> {
    return LabProgressModel.findOne({
      institutionId: toObjectId(institutionId),
      practiceLabId: toObjectId(practiceLabId),
      studentId: toObjectId(studentId),
    }).exec();
  }

  async listProgressForLab(institutionId: string, practiceLabId: string) {
    return LabProgressModel.find({
      institutionId: toObjectId(institutionId),
      practiceLabId: toObjectId(practiceLabId),
    })
      .sort({ problemsSolved: -1, successRate: -1 })
      .exec();
  }

  async listLanguages(enabledOnly = true): Promise<LanguageDocument[]> {
    const filter = enabledOnly ? { enabled: true } : {};
    return LanguageModel.find(filter).sort({ order: 1 }).exec();
  }

  async upsertLanguages(
    entries: {
      key: string;
      name: string;
      judge0Id: number;
      monacoLanguage: string;
      version: string | null;
      enabled: boolean;
      order: number;
    }[],
  ) {
    for (const entry of entries) {
      await LanguageModel.findOneAndUpdate({ key: entry.key }, { $set: entry }, { upsert: true });
    }
  }

  async logAudit(input: {
    institutionId: string;
    practiceLabId?: string | null;
    problemId?: string | null;
    submissionId?: string | null;
    executionId?: string | null;
    studentId?: string | null;
    courseId?: string | null;
    userId?: string | null;
    email?: string | null;
    event: PracticeLabAuditEvent;
    metadata?: Record<string, unknown>;
  }) {
    await PracticeLabAuditLogModel.create({
      institutionId: toObjectId(input.institutionId),
      practiceLabId: input.practiceLabId ? toObjectId(input.practiceLabId) : null,
      problemId: input.problemId ? toObjectId(input.problemId) : null,
      submissionId: input.submissionId ? toObjectId(input.submissionId) : null,
      executionId: input.executionId ? toObjectId(input.executionId) : null,
      studentId: input.studentId ? toObjectId(input.studentId) : null,
      courseId: input.courseId ? toObjectId(input.courseId) : null,
      userId: input.userId ? toObjectId(input.userId) : null,
      email: input.email ?? null,
      event: input.event,
      metadata: input.metadata ?? {},
    });
  }

  async listAudit(institutionId: string, page = 1, limit = 50) {
    const filter = { institutionId: toObjectId(institutionId) };
    const [items, total] = await Promise.all([
      PracticeLabAuditLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      PracticeLabAuditLogModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  async acceptedProblemIds(studentId: string, problemIds: string[]): Promise<Set<string>> {
    if (problemIds.length === 0) return new Set();
    const rows = await StudentCodeSubmissionModel.find({
      studentId: toObjectId(studentId),
      problemId: { $in: problemIds.map(toObjectId) },
      verdict: 'accepted',
      deletedAt: null,
    })
      .select('problemId')
      .lean()
      .exec();
    return new Set(rows.map((r) => String(r.problemId)));
  }

  async countExecutionsSince(institutionId: string, since: Date): Promise<number> {
    return ExecutionHistoryModel.countDocuments({
      institutionId: toObjectId(institutionId),
      createdAt: { $gte: since },
    }).exec();
  }

  async countAcceptedRate(institutionId: string): Promise<number> {
    const [total, accepted] = await Promise.all([
      StudentCodeSubmissionModel.countDocuments({
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      }),
      StudentCodeSubmissionModel.countDocuments({
        institutionId: toObjectId(institutionId),
        verdict: 'accepted',
        deletedAt: null,
      }),
    ]);
    if (total === 0) return 0;
    return Math.round((accepted / total) * 1000) / 10;
  }
}

export const practiceLabRepository = new PracticeLabRepository();
