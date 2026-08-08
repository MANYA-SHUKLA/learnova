import { Types } from 'mongoose';
import type { QuizListQuery } from '@learnova/validation';
import { questionListQuerySchema } from '@learnova/validation';
import type { z } from 'zod';
import { buildQuestionStatRow, computePassRate } from '@learnova/shared';
import { QuizModel, type QuizDocument } from '../../models/quiz.model.js';
import { QuizSectionModel, type QuizSectionDocument } from '../../models/quiz-section.model.js';
import { QuestionBankModel, type QuestionBankDocument } from '../../models/question-bank.model.js';
import { QuestionModel, type QuestionDocument } from '../../models/question.model.js';
import {
  QuestionCategoryModel,
  type QuestionCategoryDocument,
} from '../../models/question-category.model.js';
import { QuestionTagModel, type QuestionTagDocument } from '../../models/question-tag.model.js';
import { QuizAttemptModel, type QuizAttemptDocument } from '../../models/quiz-attempt.model.js';
import { QuizAnswerModel, type QuizAnswerDocument } from '../../models/quiz-answer.model.js';
import { QuizResultModel, type QuizResultDocument } from '../../models/quiz-result.model.js';
import { QuizAuditLogModel, type QuizAuditEvent } from '../../models/quiz-audit-log.model.js';

type QuestionListQuery = z.infer<typeof questionListQuerySchema>;

export interface QuizListResult {
  items: QuizDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface QuestionListResult {
  items: QuestionDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface QuestionBankListResult {
  items: QuestionBankDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface AttemptListResult {
  items: QuizAttemptDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface QuizStats {
  total: number;
  draft: number;
  published: number;
  closed: number;
  archived: number;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number | null;
  passRate: number | null;
  questionBankSize: number;
  totalQuestions: number;
  byCourse: { courseId: string; courseCode: string; title: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byType: { quizType: string; count: number }[];
}

export interface QuizAnalyticsRow {
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

export class QuizRepository {
  // ---------------------------------------------------------------- quizzes

  buildQuizFilter(
    institutionId: string,
    query: Partial<QuizListQuery>,
    now: Date = new Date(),
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };

    if (query.courseId) filter.courseId = toObjectId(query.courseId);
    if (query.moduleId) filter.moduleId = toObjectId(query.moduleId);
    if (query.lessonId) filter.lessonId = toObjectId(query.lessonId);
    if (query.status) filter.status = query.status;
    if (query.quizType) filter.quizType = query.quizType;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.createdBy) filter.createdBy = toObjectId(query.createdBy);
    if (query.published !== undefined) {
      filter.status = query.published ? 'published' : { $ne: 'published' };
    }

    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ title: regex }, { description: regex }, { instructions: regex }];
    }

    if (now) {
      // reserved for future date-based filters
    }

    return filter;
  }

  async listQuizzes(
    filter: Record<string, unknown>,
    query: Pick<QuizListQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>,
  ): Promise<QuizListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      QuizModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      QuizModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findQuizById(institutionId: string, id: string): Promise<QuizDocument | null> {
    return QuizModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async findQuizBySlug(institutionId: string, slug: string): Promise<QuizDocument | null> {
    return QuizModel.findOne({
      institutionId: toObjectId(institutionId),
      slug,
      deletedAt: null,
    }).exec();
  }

  async findQuizzesByIds(institutionId: string, ids: string[]): Promise<QuizDocument[]> {
    return QuizModel.find({
      _id: { $in: ids.map(toObjectId) },
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createQuiz(data: Record<string, unknown>): Promise<QuizDocument> {
    return QuizModel.create(data);
  }

  async updateQuizById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<QuizDocument | null> {
    return QuizModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteQuiz(institutionId: string, id: string): Promise<QuizDocument | null> {
    return QuizModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  async bulkUpdateQuizStatus(
    institutionId: string,
    ids: string[],
    status: string,
  ): Promise<number> {
    const res = await QuizModel.updateMany(
      {
        _id: { $in: ids.map(toObjectId) },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set: { status } },
    ).exec();
    return res.modifiedCount;
  }

  async bulkSoftDeleteQuizzes(institutionId: string, ids: string[]): Promise<number> {
    const res = await QuizModel.updateMany(
      {
        _id: { $in: ids.map(toObjectId) },
        institutionId: toObjectId(institutionId),
        deletedAt: null,
      },
      { $set: { deletedAt: new Date() } },
    ).exec();
    return res.modifiedCount;
  }

  async countQuizzes(filter: Record<string, unknown>): Promise<number> {
    return QuizModel.countDocuments(filter).exec();
  }

  // ---------------------------------------------------------------- sections

  async listSectionsByQuiz(
    institutionId: string,
    quizId: string,
  ): Promise<QuizSectionDocument[]> {
    return QuizSectionModel.find({
      institutionId: toObjectId(institutionId),
      quizId: toObjectId(quizId),
      deletedAt: null,
    })
      .sort({ displayOrder: 1 })
      .exec();
  }

  async createSection(data: Record<string, unknown>): Promise<QuizSectionDocument> {
    return QuizSectionModel.create(data);
  }

  async softDeleteSectionsByQuiz(institutionId: string, quizId: string): Promise<number> {
    const res = await QuizSectionModel.updateMany(
      {
        institutionId: toObjectId(institutionId),
        quizId: toObjectId(quizId),
        deletedAt: null,
      },
      { $set: { deletedAt: new Date() } },
    ).exec();
    return res.modifiedCount;
  }

  // ---------------------------------------------------------------- question banks

  buildQuestionBankFilter(
    institutionId: string,
    query: { q?: string; status?: string },
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };
    if (query.status) filter.status = query.status;
    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }
    return filter;
  }

  async listQuestionBanks(
    filter: Record<string, unknown>,
    query: { page?: number; limit?: number },
  ): Promise<QuestionBankListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await Promise.all([
      QuestionBankModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      QuestionBankModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findQuestionBankById(
    institutionId: string,
    id: string,
  ): Promise<QuestionBankDocument | null> {
    return QuestionBankModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createQuestionBank(data: Record<string, unknown>): Promise<QuestionBankDocument> {
    return QuestionBankModel.create(data);
  }

  async updateQuestionBankById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<QuestionBankDocument | null> {
    return QuestionBankModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteQuestionBank(
    institutionId: string,
    id: string,
  ): Promise<QuestionBankDocument | null> {
    return QuestionBankModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  async incrementQuestionBankCount(
    institutionId: string,
    id: string,
    delta: number,
  ): Promise<void> {
    await QuestionBankModel.updateOne(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $inc: { questionCount: delta } },
    ).exec();
  }

  // ---------------------------------------------------------------- questions

  buildQuestionFilter(
    institutionId: string,
    query: Partial<QuestionListQuery>,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    };

    if (query.questionBankId) filter.questionBankId = toObjectId(query.questionBankId);
    if (query.questionType) filter.questionType = query.questionType;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.category) filter.category = query.category;
    if (query.tag) filter.tags = query.tag;
    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ question: regex }, { description: regex }];
    }

    return filter;
  }

  async listQuestions(
    filter: Record<string, unknown>,
    query: Pick<QuestionListQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>,
  ): Promise<QuestionListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      QuestionModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      QuestionModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findQuestionById(institutionId: string, id: string): Promise<QuestionDocument | null> {
    return QuestionModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

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

  async createQuestion(data: Record<string, unknown>): Promise<QuestionDocument> {
    return QuestionModel.create(data);
  }

  async updateQuestionById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<QuestionDocument | null> {
    return QuestionModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteQuestion(
    institutionId: string,
    id: string,
  ): Promise<QuestionDocument | null> {
    return QuestionModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  async countQuestions(filter: Record<string, unknown>): Promise<number> {
    return QuestionModel.countDocuments(filter).exec();
  }

  // ---------------------------------------------------------------- categories / tags

  async listCategories(institutionId: string): Promise<QuestionCategoryDocument[]> {
    return QuestionCategoryModel.find({
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    })
      .sort({ name: 1 })
      .exec();
  }

  async findCategoryById(
    institutionId: string,
    id: string,
  ): Promise<QuestionCategoryDocument | null> {
    return QuestionCategoryModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createCategory(data: Record<string, unknown>): Promise<QuestionCategoryDocument> {
    return QuestionCategoryModel.create(data);
  }

  async updateCategoryById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<QuestionCategoryDocument | null> {
    return QuestionCategoryModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteCategory(
    institutionId: string,
    id: string,
  ): Promise<QuestionCategoryDocument | null> {
    return QuestionCategoryModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  async listTags(institutionId: string): Promise<QuestionTagDocument[]> {
    return QuestionTagModel.find({
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    })
      .sort({ name: 1 })
      .exec();
  }

  async findTagById(institutionId: string, id: string): Promise<QuestionTagDocument | null> {
    return QuestionTagModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
      deletedAt: null,
    }).exec();
  }

  async createTag(data: Record<string, unknown>): Promise<QuestionTagDocument> {
    return QuestionTagModel.create(data);
  }

  async updateTagById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<QuestionTagDocument | null> {
    return QuestionTagModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: data },
      { new: true },
    ).exec();
  }

  async softDeleteTag(
    institutionId: string,
    id: string,
  ): Promise<QuestionTagDocument | null> {
    return QuestionTagModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }

  // ---------------------------------------------------------------- attempts

  async listAttempts(
    filter: Record<string, unknown>,
    query: { page?: number; limit?: number },
  ): Promise<AttemptListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await Promise.all([
      QuizAttemptModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      QuizAttemptModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findAttemptById(
    institutionId: string,
    id: string,
  ): Promise<QuizAttemptDocument | null> {
    return QuizAttemptModel.findOne({
      _id: id,
      institutionId: toObjectId(institutionId),
    }).exec();
  }

  async countStudentAttempts(quizId: string, studentId: string): Promise<number> {
    return QuizAttemptModel.countDocuments({
      quizId: toObjectId(quizId),
      studentId: toObjectId(studentId),
      status: { $ne: 'abandoned' },
    }).exec();
  }

  async createAttempt(data: Record<string, unknown>): Promise<QuizAttemptDocument> {
    return QuizAttemptModel.create(data);
  }

  async updateAttemptById(
    institutionId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<QuizAttemptDocument | null> {
    return QuizAttemptModel.findOneAndUpdate(
      { _id: id, institutionId: toObjectId(institutionId) },
      { $set: data },
      { new: true },
    ).exec();
  }

  async countAttempts(filter: Record<string, unknown>): Promise<number> {
    return QuizAttemptModel.countDocuments(filter).exec();
  }

  async averageAttemptScore(filter: Record<string, unknown>): Promise<number | null> {
    const rows = await QuizAttemptModel.aggregate<{ avg: number | null }>([
      { $match: { ...filter, status: { $in: ['submitted', 'completed'] } } },
      { $group: { _id: null, avg: { $avg: '$percentage' } } },
    ]);
    const avg = rows[0]?.avg;
    return typeof avg === 'number' ? Math.round(avg * 100) / 100 : null;
  }

  // ---------------------------------------------------------------- answers / results

  async upsertAnswer(
    institutionId: string,
    attemptId: string,
    questionId: string,
    data: Record<string, unknown>,
  ): Promise<QuizAnswerDocument> {
    return QuizAnswerModel.findOneAndUpdate(
      {
        attemptId: toObjectId(attemptId),
        questionId: toObjectId(questionId),
      },
      {
        $set: {
          institutionId: toObjectId(institutionId),
          attemptId: toObjectId(attemptId),
          questionId: toObjectId(questionId),
          ...data,
        },
      },
      { upsert: true, new: true },
    ).exec();
  }

  async listAnswersByAttempt(attemptId: string): Promise<QuizAnswerDocument[]> {
    return QuizAnswerModel.find({ attemptId: toObjectId(attemptId) }).exec();
  }

  async createResult(data: Record<string, unknown>): Promise<QuizResultDocument> {
    return QuizResultModel.create(data);
  }

  async findResultByAttempt(attemptId: string): Promise<QuizResultDocument | null> {
    return QuizResultModel.findOne({ attemptId: toObjectId(attemptId) }).exec();
  }

  async listResultsByQuiz(
    institutionId: string,
    quizId: string,
    limit = 100,
  ): Promise<QuizResultDocument[]> {
    return QuizResultModel.find({
      institutionId: toObjectId(institutionId),
      quizId: toObjectId(quizId),
    })
      .sort({ score: -1 })
      .limit(limit)
      .exec();
  }

  // ---------------------------------------------------------------- analytics

  async getQuizAnalytics(
    institutionId: string,
    quizId: string,
  ): Promise<{
    totalAttempts: number;
    averageScore: number | null;
    passRate: number | null;
    averageTimeSeconds: number | null;
    questionStats: QuizAnalyticsRow[];
  }> {
    const oid = toObjectId(institutionId);
    const quizOid = toObjectId(quizId);
    const attemptBase = { institutionId: oid, quizId: quizOid };

    const [totalAttempts, avgScoreRows, passRows, avgTimeRows, questionStats] =
      await Promise.all([
        QuizAttemptModel.countDocuments({
          ...attemptBase,
          status: { $in: ['submitted', 'completed'] },
        }),
        QuizAttemptModel.aggregate<{ avg: number | null }>([
          {
            $match: {
              ...attemptBase,
              status: { $in: ['submitted', 'completed'] },
            },
          },
          { $group: { _id: null, avg: { $avg: '$percentage' } } },
        ]),
        QuizResultModel.aggregate<{ passed: number; total: number }>([
          { $match: { institutionId: oid, quizId: quizOid } },
          {
            $group: {
              _id: null,
              passed: { $sum: { $cond: ['$passed', 1, 0] } },
              total: { $sum: 1 },
            },
          },
        ]),
        QuizAttemptModel.aggregate<{ avg: number | null }>([
          {
            $match: {
              ...attemptBase,
              status: { $in: ['submitted', 'completed'] },
            },
          },
          { $group: { _id: null, avg: { $avg: '$timeTakenSeconds' } } },
        ]),
        QuizAnswerModel.aggregate<{
          _id: Types.ObjectId;
          total: number;
          correct: number;
          avgTime: number | null;
        }>([
          {
            $lookup: {
              from: 'quiz_attempts',
              localField: 'attemptId',
              foreignField: '_id',
              as: 'attempt',
            },
          },
          { $unwind: '$attempt' },
          { $match: { 'attempt.quizId': quizOid, 'attempt.institutionId': oid } },
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

    const stats: QuizAnalyticsRow[] = questionStats.map((row) => {
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
      questionStats: stats,
    };
  }

  async getStats(institutionId: string): Promise<QuizStats> {
    const oid = toObjectId(institutionId);
    const base = { institutionId: oid, deletedAt: null };

    const [
      total,
      draft,
      published,
      closed,
      archived,
      totalAttempts,
      completedAttempts,
      averageScore,
      passRows,
      questionBankSize,
      totalQuestions,
      byCourseRaw,
      byStatusRaw,
      byTypeRaw,
    ] = await Promise.all([
      QuizModel.countDocuments(base),
      QuizModel.countDocuments({ ...base, status: 'draft' }),
      QuizModel.countDocuments({ ...base, status: 'published' }),
      QuizModel.countDocuments({ ...base, status: 'closed' }),
      QuizModel.countDocuments({ ...base, status: 'archived' }),
      QuizAttemptModel.countDocuments({ institutionId: oid }),
      QuizAttemptModel.countDocuments({
        institutionId: oid,
        status: { $in: ['submitted', 'completed'] },
      }),
      this.averageAttemptScore({ institutionId: oid }),
      QuizResultModel.aggregate<{ passed: number; total: number }>([
        { $match: { institutionId: oid } },
        {
          $group: {
            _id: null,
            passed: { $sum: { $cond: ['$passed', 1, 0] } },
            total: { $sum: 1 },
          },
        },
      ]),
      QuestionBankModel.countDocuments({ ...base, status: 'active' }),
      QuestionModel.countDocuments(base),
      QuizModel.aggregate([
        { $match: base },
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
        {
          $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' },
        },
        {
          $project: {
            courseId: { $toString: '$_id' },
            courseCode: { $ifNull: [{ $arrayElemAt: ['$course.courseCode', 0] }, ''] },
            title: { $ifNull: [{ $arrayElemAt: ['$course.title', 0] }, 'Unknown'] },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      QuizModel.aggregate([{ $match: base }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      QuizModel.aggregate([
        { $match: base },
        { $group: { _id: '$quizType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const passRow = passRows[0];
    const passRate =
      passRow && passRow.total > 0
        ? Math.round((passRow.passed / passRow.total) * 10000) / 100
        : null;

    return {
      total,
      draft,
      published,
      closed,
      archived,
      totalAttempts,
      completedAttempts,
      averageScore,
      passRate,
      questionBankSize,
      totalQuestions,
      byCourse: byCourseRaw as QuizStats['byCourse'],
      byStatus: byStatusRaw.map((row) => ({
        status: String(row._id),
        count: row.count as number,
      })),
      byType: byTypeRaw.map((row) => ({
        quizType: String(row._id),
        count: row.count as number,
      })),
    };
  }

  // ---------------------------------------------------------------- audit

  async listAudit(institutionId: string, quizId?: string, limit = 50) {
    const filter: Record<string, unknown> = { institutionId: toObjectId(institutionId) };
    if (quizId) filter.quizId = toObjectId(quizId);
    return QuizAuditLogModel.find(filter).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async logAudit(input: {
    event: QuizAuditEvent;
    institutionId: string;
    quizId?: string | null;
    questionId?: string | null;
    attemptId?: string | null;
    courseId?: string | null;
    userId?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return QuizAuditLogModel.create({
      event: input.event,
      institutionId: toObjectId(input.institutionId),
      quizId: input.quizId ? toObjectId(input.quizId) : null,
      questionId: input.questionId ? toObjectId(input.questionId) : null,
      attemptId: input.attemptId ? toObjectId(input.attemptId) : null,
      courseId: input.courseId ? toObjectId(input.courseId) : null,
      userId: input.userId ? toObjectId(input.userId) : null,
      email: input.email ?? null,
      metadata: input.metadata ?? {},
    });
  }
}

export const quizRepository = new QuizRepository();
