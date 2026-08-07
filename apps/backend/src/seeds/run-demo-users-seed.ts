/**
 * Seed demo users (faculty + student) into MongoDB.
 * Usage: pnpm --filter @learnova/backend seed:demo
 * Requires: SEED_INSTITUTION_ID env variable
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { seedDemoUsers } from './demo-users.seed.js';

async function main(): Promise<void> {
  await connectMongo();

  let institutionId = process.env.SEED_INSTITUTION_ID?.trim();
  if (!institutionId) {
    const { InstitutionModel } = await import('../models/index.js');
    const first = await InstitutionModel.findOne({ deletedAt: null })
      .select('_id name')
      .lean();
    if (!first) {
      throw new Error(
        'SEED_INSTITUTION_ID is required and no institutions exist. Create an institution first, then set SEED_INSTITUTION_ID in apps/backend/.env',
      );
    }
    institutionId = String(first._id);
    logger.warn(
      { institutionId, name: first.name },
      'SEED_INSTITUTION_ID not set — using first institution',
    );
  }

  logger.info({ institutionId }, 'Starting demo users seed...');

  const result = await seedDemoUsers(institutionId);

  logger.info(result, 'Demo users seed completed');
  logger.info('Login credentials:');
  logger.info('  Faculty: faculty.demo@learnova.test / Demo@12345');
  logger.info('  Student: student.demo@learnova.test / Demo@12345');

  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Demo users seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
