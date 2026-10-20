import { connectDatabase, disconnectDatabase } from '../database/index.js';
import { seedAuth } from './auth.seed.js';
import { seedSuperAdminUser } from './super-admin.seed.js';

async function main() {
  await connectDatabase();
  await seedAuth();
  await seedSuperAdminUser();
  console.log('Super admin seed complete');
  await disconnectDatabase();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
