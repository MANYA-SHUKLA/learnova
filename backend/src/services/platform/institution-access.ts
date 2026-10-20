import type { Types } from 'mongoose';
import { InstitutionModel } from '../../models/institution.model.js';

export type InstitutionCampusState = 'active' | 'missing' | 'suspended' | 'archived';

export async function getInstitutionCampusState(
  institutionId: Types.ObjectId | string,
): Promise<InstitutionCampusState> {
  const doc = await InstitutionModel.findById(institutionId).select('status deletedAt').lean().exec();
  if (!doc || doc.deletedAt) return 'missing';
  if (doc.status === 'active') return 'active';
  if (doc.status === 'inactive') return 'suspended';
  return 'archived';
}

export const INSTITUTION_SUSPENDED_MESSAGE =
  'This campus is suspended. Contact platform support if you need access restored.';
