/**
 * Sync enrollments from published timetable slots (section → course) and link faculty on courses.
 *
 * Usage: pnpm --filter @learnova/backend exec tsx src/scripts/sync-timetable-enrollments.ts [institutionId]
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { InstitutionModel } from '../models/index.js';
import { ensureMonsoonDemoSectionStudents } from '../services/institution/ensure-monsoon-demo-students.js';
import { syncTimetableSectionEnrollments } from '../services/institution/sync-timetable-section-enrollments.js';
import { logger } from '../utils/logger/index.js';

async function main() {
  const institutionIdArg = process.argv[2];
  await connectMongo();

  let institutionId = institutionIdArg;
  if (!institutionId) {
    const inst = await InstitutionModel.findOne({ deletedAt: null }).select('_id slug').lean().exec();
    if (!inst) throw new Error('No institution found');
    institutionId = String(inst._id);
    logger.info({ slug: inst.slug, institutionId }, 'Using institution');
  }

  await ensureMonsoonDemoSectionStudents(institutionId);
  const result = await syncTimetableSectionEnrollments(institutionId);
  logger.info(result, 'Done');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  console.error(err);
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
