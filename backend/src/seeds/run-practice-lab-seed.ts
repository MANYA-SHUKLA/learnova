/**
 * Seed practice labs into MongoDB.
 * Usage: pnpm --filter @learnova/backend seed:practice-labs
 *
 * Requires SEED_INSTITUTION_ID and prior course/student seeds.
 * Set SEED_FORCE=1 to replace existing practice lab data.
 */

import '../config/load-env.js';
import { Types } from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { CourseModel, StudentModel, UserModel } from '../models/index.js';
import { logger } from '../utils/logger/index.js';
import { seedPracticeLabs, type PracticeLabSeedRefs } from './practice-lab.seed.js';

async function loadRefs(institutionId: string): Promise<PracticeLabSeedRefs> {
  const oid = new Types.ObjectId(institutionId);

  const [courses, students, user] = await Promise.all([
    CourseModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    StudentModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    UserModel.findOne({ institutionId: oid }).select('_id').lean(),
  ]);

  const courseIds = courses.map((d) => String(d._id));
  const studentIds = students.map((d) => String(d._id));

  logger.info(
    { courses: courseIds.length, students: studentIds.length },
    'Loaded practice lab seed refs from database',
  );

  if (courseIds.length === 0 || studentIds.length === 0) {
    throw new Error(
      'No courses and/or students found for SEED_INSTITUTION_ID. Run seed:courses and seed:students first.',
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
  const result = await seedPracticeLabs(institutionId, refs, {
    force,
    labTarget: 30,
    problemTarget: 300,
    testCaseTarget: 5000,
    submissionTarget: 10_000,
  });

  logger.info(result, 'Practice lab seed completed');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Practice lab seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
