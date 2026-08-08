/**
 * Wire demo faculty/student into courses, enrollments, and assessment grades.
 * Usage: pnpm --filter @learnova/backend seed:demo-data
 *
 * Run after seed:demo and assessment seeds (assignments/quizzes/etc).
 * Run finalize step after gradebook via seed:demo-finalize.
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { seedDemoData } from './demo-data.seed.js';
import { resolveSeedInstitutionId } from './seed-utils.js';

async function main(): Promise<void> {
  await connectMongo();
  const institutionId = await resolveSeedInstitutionId();
  logger.info({ institutionId }, 'Starting demo data seed...');
  const result = await seedDemoData(institutionId);
  logger.info(result, 'Demo data seed completed');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Demo data seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
