/**
 * Shared helpers for seed runners.
 */

import { InstitutionModel } from '../models/index.js';
import { logger } from '../utils/logger/index.js';

export async function resolveSeedInstitutionId(): Promise<string> {
  let institutionId = process.env.SEED_INSTITUTION_ID?.trim();
  if (institutionId) return institutionId;

  const first = await InstitutionModel.findOne({ deletedAt: null }).select('_id name').lean();
  if (!first) {
    throw new Error(
      'SEED_INSTITUTION_ID is required and no institutions exist. Create an institution first.',
    );
  }

  institutionId = String(first._id);
  logger.warn({ institutionId, name: first.name }, 'SEED_INSTITUTION_ID not set — using first institution');
  return institutionId;
}

export function seedForceEnabled(): boolean {
  return process.env.SEED_FORCE === '1' || process.env.SEED_FORCE === 'true';
}
