/**
 * Seed published timetable + sample slots for the active semester.
 * Usage: pnpm --filter @learnova/backend seed:timetable
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { seedForceEnabled } from './seed-utils.js';
import { seedTimetable } from './timetable.seed.js';

async function main(): Promise<void> {
  const institutionId = process.env.SEED_INSTITUTION_ID?.trim();
  if (!institutionId) {
    throw new Error('SEED_INSTITUTION_ID is required');
  }

  await connectMongo();
  try {
    const result = await seedTimetable(institutionId, { force: seedForceEnabled() });
    logger.info(result, 'Timetable seed finished');
  } finally {
    await disconnectMongo();
  }
}

main().catch((err) => {
  logger.error({ err }, 'Timetable seed failed');
  process.exit(1);
});
