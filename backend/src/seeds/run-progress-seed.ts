/**
 * Seed progress tracking into MongoDB.
 * Usage: pnpm --filter @learnova/backend seed:progress
 *
 * Loads real enrollments. If published modules/lessons are missing, bootstraps
 * minimal seed modules/lessons per course, then generates realistic progress,
 * bookmarks, notes, and activities.
 *
 * Set SEED_FORCE=1 to replace existing progress for the institution.
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { seedProgress } from './progress.seed.js';

async function main(): Promise<void> {
  await connectMongo();

  const institutionId = process.env.SEED_INSTITUTION_ID;
  if (!institutionId) {
    throw new Error('SEED_INSTITUTION_ID is required in backend/.env');
  }

  const force = process.env.SEED_FORCE === '1' || process.env.SEED_FORCE === 'true';
  const result = await seedProgress(institutionId, { force, limit: 500 });

  logger.info(result, 'Progress seed finished');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Progress seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
