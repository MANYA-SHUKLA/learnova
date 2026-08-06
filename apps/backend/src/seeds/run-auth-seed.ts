/**
 * Seed roles & permissions into MongoDB.
 * Usage: pnpm --filter @learnova/backend seed:auth
 */

import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { seedAuth } from './auth.seed.js';

async function main(): Promise<void> {
  await connectMongo();
  await seedAuth();
  logger.info('Auth seed completed (roles + permissions)');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Auth seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
