/**
 * Remove every institution except SOE JNU (and all tenant data for removed campuses).
 *
 * Keeps institution resolved by (in order):
 *   1. SEED_INSTITUTION_ID in backend/.env
 *   2. DEFAULT_INSTITUTION_SLUG (e.g. jnu)
 *   3. Active institution whose name matches SOE / JNU
 *
 * Usage: pnpm --filter @learnova/backend db:purge-other-institutions
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { InstitutionModel } from '../models/institution.model.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger/index.js';
import { purgeInstitutionData } from '../services/platform/purge-institution.js';

async function resolveKeepInstitutionId(): Promise<string> {
  const fromEnv = process.env.SEED_INSTITUTION_ID?.trim();
  if (fromEnv) {
    const doc = await InstitutionModel.findById(fromEnv).select('_id name slug').lean().exec();
    if (!doc) {
      throw new Error(`SEED_INSTITUTION_ID ${fromEnv} not found`);
    }
    logger.info(
      { id: String(doc._id), name: doc.name, slug: doc.slug },
      'Keeping institution (SEED_INSTITUTION_ID)',
    );
    return String(doc._id);
  }

  const slug = env.DEFAULT_INSTITUTION_SLUG?.trim().toLowerCase();
  if (slug) {
    const bySlug = await InstitutionModel.findOne({ slug, deletedAt: null })
      .select('_id name slug')
      .lean()
      .exec();
    if (bySlug) {
      logger.info(
        { id: String(bySlug._id), name: bySlug.name, slug: bySlug.slug },
        'Keeping institution (DEFAULT_INSTITUTION_SLUG)',
      );
      return String(bySlug._id);
    }
  }

  const byName = await InstitutionModel.findOne({
    deletedAt: null,
    $or: [
      { name: /school of engineering/i },
      { name: /soe.*jnu/i },
      { shortName: /soe/i },
      { slug: /^jnu$/i },
    ],
  })
    .sort({ createdAt: 1 })
    .select('_id name slug')
    .lean()
    .exec();

  if (!byName) {
    throw new Error(
      'Could not find SOE JNU institution — set SEED_INSTITUTION_ID or DEFAULT_INSTITUTION_SLUG=jnu',
    );
  }

  logger.info(
    { id: String(byName._id), name: byName.name, slug: byName.slug },
    'Keeping institution (name/slug match)',
  );
  return String(byName._id);
}

async function main(): Promise<void> {
  await connectMongo();

  const keepId = await resolveKeepInstitutionId();

  const others = await InstitutionModel.find({ _id: { $ne: keepId } })
    .select('_id name slug code')
    .lean()
    .exec();

  if (others.length === 0) {
    logger.info('No other institutions to remove');
    await disconnectMongo();
    return;
  }

  logger.info(
    { count: others.length, names: others.map((i) => i.name) },
    'Purging institutions',
  );

  for (const inst of others) {
    const id = String(inst._id);
    logger.info({ id, name: inst.name, slug: inst.slug }, 'Purging campus');
    const { deletedByCollection } = await purgeInstitutionData(id);
    logger.info({ id, name: inst.name, deletedByCollection }, 'Campus removed');
  }

  const remaining = await InstitutionModel.countDocuments({}).exec();
  logger.info({ remaining, keepId }, 'Done — only SOE JNU should remain');

  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'db:purge-other-institutions failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
