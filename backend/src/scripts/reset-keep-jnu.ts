/**
 * Dev reset: wipe MongoDB data but keep the JNU institution document
 * (+ global roles/permissions, + institution_admin users for JNU).
 *
 * Usage: pnpm --filter @learnova/backend db:reset-keep-jnu
 */

import '../config/load-env.js';
import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { roleRepository } from '../repositories/auth/index.js';

const KEEP_COLLECTIONS = new Set(['institutions', 'roles', 'permissions']);

/** Session / auth noise — wipe entirely in local reset */
const WIPE_ENTIRELY = new Set([
  'sessions',
  'refreshtokens',
  'loginattempts',
  'auditauthlogs',
  'eventoutboxes',
  'bullmq',
]);

async function main(): Promise<void> {
  const institutionId = process.env.SEED_INSTITUTION_ID?.trim();
  if (!institutionId) {
    throw new Error('SEED_INSTITUTION_ID is required in backend/.env');
  }

  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) throw new Error('Mongo connection missing db handle');

  const iid = new mongoose.Types.ObjectId(institutionId);
  const institution = await db.collection('institutions').findOne({ _id: iid });
  if (!institution) {
    throw new Error(`Institution ${institutionId} not found — aborting wipe`);
  }

  logger.info(
    {
      id: institutionId,
      name: (institution as { name?: string }).name,
      shortName: (institution as { shortName?: string }).shortName,
    },
    'Keeping institution',
  );

  const otherInst = await db.collection('institutions').deleteMany({ _id: { $ne: iid } });
  logger.info({ deleted: otherInst.deletedCount }, 'Removed non-JNU institutions');

  const adminRole = await roleRepository.findByName('institution_admin');
  const adminRoleId = adminRole?._id;

  const collections = await db.listCollections().toArray();
  for (const { name } of collections) {
    if (KEEP_COLLECTIONS.has(name)) continue;

    const lower = name.toLowerCase();

    if (name === 'users') {
      const filter = adminRoleId
        ? {
            $or: [
              { institutionId: { $ne: iid } },
              { institutionId: iid, roleId: { $ne: adminRoleId } },
            ],
          }
        : { institutionId: { $ne: iid } };
      const result = await db.collection(name).deleteMany(filter);
      logger.info({ collection: name, deleted: result.deletedCount }, 'Users pruned');
      continue;
    }

    if ([...WIPE_ENTIRELY].some((n) => lower.includes(n) || lower === n)) {
      const wipe = await db.collection(name).deleteMany({});
      if (wipe.deletedCount) {
        logger.info({ collection: name, deleted: wipe.deletedCount }, 'Wiped auth/session collection');
      }
      continue;
    }

    try {
      const scoped = await db.collection(name).deleteMany({});
      if (scoped.deletedCount) {
        logger.info({ collection: name, deleted: scoped.deletedCount }, 'Collection wiped');
      }
    } catch (err) {
      logger.warn({ err, collection: name }, 'Skip collection');
    }
  }

  const remainingAdmins = adminRoleId
    ? await db.collection('users').countDocuments({ institutionId: iid, roleId: adminRoleId })
    : 0;

  logger.info(
    {
      institutionId,
      institutionAdminsKept: remainingAdmins,
      students: await db.collection('students').countDocuments({}).catch(() => 0),
      faculties: await db.collection('faculties').countDocuments({}).catch(() => 0),
      users: await db.collection('users').countDocuments({}),
    },
    'Reset complete — JNU institution + institution_admin user(s) kept',
  );

  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'db:reset-keep-jnu failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
