/**
 * Seed demo users (faculty + student) into MongoDB.
 * Usage: pnpm --filter @learnova/backend seed:demo
 * Requires: SEED_INSTITUTION_ID env variable
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import {
  DEMO_FACULTY_EMAIL,
  DEMO_FACULTY_PASSWORD,
  DEMO_STUDENT_EMAIL,
  DEMO_STUDENT_PASSWORD,
  seedDemoUsers,
} from './demo-users.seed.js';

import { resolveSeedInstitutionId } from './seed-utils.js';

async function main(): Promise<void> {
  await connectMongo();

  const institutionId = await resolveSeedInstitutionId();

  const result = await seedDemoUsers(institutionId);

  logger.info(result, 'Demo users seed completed');
  logger.info('Login credentials:');
  logger.info(`  Faculty: ${DEMO_FACULTY_EMAIL} / ${DEMO_FACULTY_PASSWORD}`);
  logger.info(`  Student: ${DEMO_STUDENT_EMAIL} / ${DEMO_STUDENT_PASSWORD}`);

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
