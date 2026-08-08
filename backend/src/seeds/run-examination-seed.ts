/**
 * Seed examinations into MongoDB.
 * Usage: pnpm --filter @learnova/backend seed:examinations
 *
 * Reuses questions from quiz seed — run seed:quizzes first.
 * Set SEED_FORCE=1 to replace existing exam data for the institution.
 */

import '../config/load-env.js';
import { Types } from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { CourseModel, QuestionModel, StudentModel, UserModel } from '../models/index.js';
import { logger } from '../utils/logger/index.js';
import { seedExaminations, type ExaminationSeedRefs } from './examination.seed.js';

async function loadRefs(institutionId: string): Promise<ExaminationSeedRefs> {
  const oid = new Types.ObjectId(institutionId);

  const [courses, students, user, questionCount] = await Promise.all([
    CourseModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    StudentModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    UserModel.findOne({ institutionId: oid }).select('_id').lean(),
    QuestionModel.countDocuments({ institutionId: oid, deletedAt: null }),
  ]);

  const courseIds = courses.map((d) => String(d._id));
  const studentIds = students.map((d) => String(d._id));

  logger.info(
    { courses: courseIds.length, students: studentIds.length, questions: questionCount },
    'Loaded examination seed refs from database',
  );

  if (courseIds.length === 0 || studentIds.length === 0) {
    throw new Error(
      'No courses and/or students found for SEED_INSTITUTION_ID. Run seed:courses and seed:students first.',
    );
  }

  if (questionCount === 0) {
    throw new Error(
      'No questions found. Run seed:quizzes first to populate the shared question bank.',
    );
  }

  return {
    courseIds,
    studentIds,
    userId: user ? String(user._id) : studentIds[0]!,
  };
}

async function main(): Promise<void> {
  await connectMongo();

  const institutionId = process.env.SEED_INSTITUTION_ID;
  if (!institutionId) {
    throw new Error('SEED_INSTITUTION_ID is required in apps/backend/.env');
  }

  const force = process.env.SEED_FORCE === '1' || process.env.SEED_FORCE === 'true';
  const refs = await loadRefs(institutionId);
  const result = await seedExaminations(institutionId, refs, {
    force,
    examTarget: 50,
    attemptTarget: 1000,
  });

  logger.info(result, 'Examination seed completed');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Examination seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
