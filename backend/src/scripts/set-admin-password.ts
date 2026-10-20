/**
 * Dev-only: set institution admin password for local smoke tests.
 * Usage: pnpm exec tsx --env-file=.env src/scripts/set-admin-password.ts
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/auth/index.js';
import { logger } from '../utils/logger/index.js';
import { seedInstitutionAdminUser } from '../seeds/institution-admin.seed.js';

const PASS = process.env.SMOKE_ADMIN_PASSWORD ?? env.INSTITUTION_ADMIN_PASSWORD;

async function main(): Promise<void> {
  const institutionId = process.env.SEED_INSTITUTION_ID?.trim();
  if (!institutionId) throw new Error('SEED_INSTITUTION_ID required');

  await connectMongo();
  await seedInstitutionAdminUser(institutionId);
  const admin = await userRepository.findByEmail(env.PLATFORM_ADMIN_EMAIL.toLowerCase());
  if (!admin) throw new Error('Institution admin seed failed');

  logger.info({ email: admin.email }, 'SOE institution admin ready');
  console.log(
    JSON.stringify({
      institutionLogin: '/login',
      email: admin.email,
      password: PASS,
    }),
  );
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
