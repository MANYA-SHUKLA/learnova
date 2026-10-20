import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { env } from '../config/env.js';
import { seedAuth } from './auth.seed.js';
import { seedInstitutionAdminUser } from './institution-admin.seed.js';
import { seedSuperAdminUser } from './super-admin.seed.js';

async function main() {
  await connectMongo();
  await seedAuth();
  await seedSuperAdminUser();
  const institutionId = process.env.SEED_INSTITUTION_ID?.trim();
  if (institutionId) {
    await seedInstitutionAdminUser(institutionId);
    logger.info(
      { email: env.PLATFORM_ADMIN_EMAIL, institutionId },
      'Institution admin seeded (SOE login)',
    );
  }
  logger.info(
    {
      superAdmin: env.SUPER_ADMIN_EMAIL,
      institutionAdmin: institutionId ? env.PLATFORM_ADMIN_EMAIL : '(set SEED_INSTITUTION_ID)',
    },
    'Platform users seed complete',
  );
  await disconnectMongo();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
