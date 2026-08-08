/**
 * Finalize demo student gradebook + certificate records.
 * Usage: pnpm --filter @learnova/backend seed:demo-finalize
 *
 * Run after seed:gradebook (or as part of seed:complete).
 */

import '../config/load-env.js';
import { Types } from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { UserModel } from '../models/index.js';
import { logger } from '../utils/logger/index.js';
import { finalizeDemoStudentRecords } from './demo-data.seed.js';
import { resolveSeedInstitutionId } from './seed-utils.js';

async function main(): Promise<void> {
  await connectMongo();
  const institutionId = await resolveSeedInstitutionId();
  const user = await UserModel.findOne({ institutionId: new Types.ObjectId(institutionId) })
    .select('_id')
    .lean();
  if (!user) throw new Error('No institution user found for demo finalize actor');

  logger.info({ institutionId }, 'Finalizing demo student records...');
  const result = await finalizeDemoStudentRecords(institutionId, String(user._id));
  logger.info(result, 'Demo finalize completed');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Demo finalize failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
