/**
 * Seed assignments into MongoDB.
 * Usage: pnpm --filter @learnova/backend seed:assignments
 *
 * Loads real Course / Student IDs for SEED_INSTITUTION_ID, so run
 * seed:courses and seed:students first.
 *
 * Set SEED_FORCE=1 to replace existing assignment data for the institution.
 */

import '../config/load-env.js';
import { Types } from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { CourseModel, StudentModel, UserModel } from '../models/index.js';
import { logger } from '../utils/logger/index.js';
import { seedAssignments, type AssignmentSeedRefs } from './assignment.seed.js';
import { getSeedCounts } from './seed-utils.js';

async function loadRefs(institutionId: string): Promise<AssignmentSeedRefs> {
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
    'Loaded assignment seed refs from database',
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
    throw new Error('SEED_INSTITUTION_ID is required in backend/.env');
  }

  const force = process.env.SEED_FORCE === '1' || process.env.SEED_FORCE === 'true';
  const counts = getSeedCounts();
  const refs = await loadRefs(institutionId);
  const result = await seedAssignments(institutionId, refs, {
    force,
    assignmentTarget: counts.assignments,
    submissionTarget: counts.submissions,
    rubricTarget: counts.rubrics,
  });

  logger.info(result, 'Assignment seed completed');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Assignment seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
