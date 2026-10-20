import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { seedAuth } from './auth.seed.js';
import { seedSuperAdminUser } from './super-admin.seed.js';

async function main() {
  await connectMongo();
  await seedAuth();
  await seedSuperAdminUser();
  logger.info('Super admin seed complete');
  await disconnectMongo();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
