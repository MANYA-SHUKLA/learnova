/**
 * Dev-only: set institution admin password for local smoke tests.
 * Usage: pnpm exec tsx --env-file=.env src/scripts/set-admin-password.ts
 */

import '../config/load-env.js';
import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { hashPassword } from '../security/index.js';
import { roleRepository } from '../repositories/auth/index.js';
import { logger } from '../utils/logger/index.js';

const PASS = process.env.SMOKE_ADMIN_PASSWORD ?? 'Admin@Test1';

async function main(): Promise<void> {
  const institutionId = process.env.SEED_INSTITUTION_ID?.trim();
  if (!institutionId) throw new Error('SEED_INSTITUTION_ID required');

  await connectMongo();
  const db = mongoose.connection.db!;
  const iid = new mongoose.Types.ObjectId(institutionId);
  const adminRole = await roleRepository.findByName('institution_admin');
  if (!adminRole) throw new Error('institution_admin role missing — run seed:auth');

  const admin = await db.collection('users').findOne({ institutionId: iid, roleId: adminRole._id });
  if (!admin) throw new Error('No institution_admin user for JNU');

  const passwordHash = await hashPassword(PASS);
  await db.collection('users').updateOne(
    { _id: admin._id },
    {
      $set: {
        passwordHash,
        mustChangePassword: false,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    },
  );

  logger.info({ email: admin.email }, 'Admin password set for local testing');
  console.log(JSON.stringify({ email: admin.email, password: PASS }));
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
