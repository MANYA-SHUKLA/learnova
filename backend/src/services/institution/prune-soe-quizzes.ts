import {
  QuestionBankModel,
  QuestionModel,
  QuizModel,
  QuizSectionModel,
} from '../../models/index.js';
import { loadSoeCourseRetentionContext } from './prune-soe-courses.js';
import { listJunkSoeCourseIds } from './prune-soe-enrollments.js';

const DEMO_QUIZ_TITLE = /^Seed Course\b/i;
const DEMO_BANK_TITLE = /^Seed Question Bank\b/i;
const DEMO_QUESTION_PREFIX = /^Seed question\b/i;

/**
 * Archives quizzes, seed question banks, and related rows tied to demo / non-catalog courses.
 */
export async function pruneSoeQuizzes(institutionId: string): Promise<void> {
  const ctx = await loadSoeCourseRetentionContext(institutionId);
  if (!ctx) return;

  const resolved = await listJunkSoeCourseIds(institutionId);
  if (!resolved) return;

  const { institutionOid, junkCourseIds } = resolved;
  const now = new Date();

  const junkQuizzes = await QuizModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    $or: [
      ...(junkCourseIds.length > 0 ? [{ courseId: { $in: junkCourseIds } }] : []),
      { title: { $regex: DEMO_QUIZ_TITLE.source, $options: 'i' } },
      { description: 'Auto-generated quiz for seed data' },
      { slug: { $regex: /^seed-/i } },
    ],
  })
    .select('_id')
    .lean()
    .exec();

  const junkQuizIds = junkQuizzes.map((q) => q._id);
  if (junkQuizIds.length > 0) {
    await QuizModel.updateMany(
      { _id: { $in: junkQuizIds }, institutionId: institutionOid, deletedAt: null },
      { $set: { deletedAt: now, status: 'archived' } },
    ).exec();
    await QuizSectionModel.updateMany(
      { institutionId: institutionOid, quizId: { $in: junkQuizIds }, deletedAt: null },
      { $set: { deletedAt: now } },
    ).exec();
  }

  const seedBanks = await QuestionBankModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    title: { $regex: DEMO_BANK_TITLE.source, $options: 'i' },
  })
    .select('_id')
    .lean()
    .exec();

  const seedBankIds = seedBanks.map((b) => b._id);
  if (seedBankIds.length > 0) {
    await QuestionBankModel.updateMany(
      { _id: { $in: seedBankIds } },
      { $set: { deletedAt: now, status: 'archived' } },
    ).exec();
    await QuestionModel.updateMany(
      {
        institutionId: institutionOid,
        deletedAt: null,
        questionBankId: { $in: seedBankIds },
      },
      { $set: { deletedAt: now } },
    ).exec();
  }

  await QuestionModel.updateMany(
    {
      institutionId: institutionOid,
      deletedAt: null,
      question: { $regex: DEMO_QUESTION_PREFIX.source, $options: 'i' },
    },
    { $set: { deletedAt: now } },
  ).exec();
}
