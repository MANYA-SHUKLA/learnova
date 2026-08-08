/**
 * Seed gradebook data from existing assessment modules.
 * Usage: pnpm --filter @learnova/backend seed:gradebook
 */

import '../config/load-env.js';
import { Types } from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { CourseModel, StudentModel, UserModel } from '../models/index.js';
import { logger } from '../utils/logger/index.js';
import { seedGradebook, type GradebookSeedRefs } from './gradebook.seed.js';

async function loadRefs(institutionId: string): Promise<GradebookSeedRefs> {
  const oid = new Types.ObjectId(institutionId);
  const [courses, students, user] = await Promise.all([
    CourseModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    StudentModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    UserModel.findOne({ institutionId: oid }).select('_id').lean(),
  ]);

  return {
    courseIds: courses.map((c) => String(c._id)),
    studentIds: students.map((s) => String(s._id)),
    userId: user ? String(user._id) : String(students[0]?._id),
  };
}

async function main(): Promise<void> {
  await connectMongo();
  const institutionId = process.env.SEED_INSTITUTION_ID;
  if (!institutionId) throw new Error('SEED_INSTITUTION_ID is required');

  const force = process.env.SEED_FORCE === '1' || process.env.SEED_FORCE === 'true';
  const refs = await loadRefs(institutionId);
  const result = await seedGradebook(institutionId, refs, {
    force,
    gradeTarget: 5000,
    itemTarget: 10000,
  });

  logger.info(result, 'Gradebook seed completed');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Gradebook seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
