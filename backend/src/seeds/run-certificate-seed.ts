/**
 * Seed certificates from published gradebook data.
 * Usage: pnpm --filter @learnova/backend seed:certificates
 */

import '../config/load-env.js';
import { Types } from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { UserModel } from '../models/index.js';
import { logger } from '../utils/logger/index.js';
import { seedCertificates } from './certificate.seed.js';
import { getSeedCounts } from './seed-utils.js';

async function main(): Promise<void> {
  await connectMongo();
  const institutionId = process.env.SEED_INSTITUTION_ID;
  if (!institutionId) throw new Error('SEED_INSTITUTION_ID is required');

  const user = await UserModel.findOne({ institutionId: new Types.ObjectId(institutionId) })
    .select('_id')
    .lean();
  if (!user) throw new Error('No institution user found for seed actor');

  const force = process.env.SEED_FORCE === '1' || process.env.SEED_FORCE === 'true';
  const result = await seedCertificates(institutionId, String(user._id), {
    force,
    certificateTarget: 1000,
    transcriptTarget: 500,
  });

  logger.info(result, 'Certificate seed completed');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Certificate seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
