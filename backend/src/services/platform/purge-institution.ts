import mongoose, { Types } from 'mongoose';
import { DemoRequestModel } from '../../models/demo-request.model.js';
import {
  InstitutionAuditLogModel,
  InstitutionModel,
  InstitutionSettingsModel,
  RefreshTokenModel,
  SessionModel,
  UserModel,
} from '../../models/index.js';

const KEEP_COLLECTIONS = new Set([
  'institutions',
  'roles',
  'permissions',
  'platform_marketing',
]);

/**
 * Hard-delete all Mongo data scoped to one institution, then remove the institution row.
 */
export async function purgeInstitutionData(institutionId: string): Promise<{
  deletedByCollection: Record<string, number>;
}> {
  const oid = new Types.ObjectId(institutionId);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not ready');
  }

  const userRows = await UserModel.find({ institutionId: oid }).select('_id').lean().exec();
  const userIds = userRows.map((u) => u._id);

  if (userIds.length > 0) {
    await SessionModel.deleteMany({ userId: { $in: userIds } }).exec();
    await RefreshTokenModel.deleteMany({ userId: { $in: userIds } }).exec();
  }

  const deletedByCollection: Record<string, number> = {};

  const collections = await db.listCollections().toArray();
  for (const { name } of collections) {
    if (KEEP_COLLECTIONS.has(name)) continue;
    if (name === 'users') {
      const r = await UserModel.deleteMany({ institutionId: oid }).exec();
      if (r.deletedCount) deletedByCollection.users = r.deletedCount;
      continue;
    }
    if (name === 'institution_settings') {
      const r = await InstitutionSettingsModel.deleteMany({ institutionId: oid }).exec();
      if (r.deletedCount) deletedByCollection.institution_settings = r.deletedCount;
      continue;
    }
    if (name === 'institution_audit_logs') {
      const r = await InstitutionAuditLogModel.deleteMany({ institutionId: oid }).exec();
      if (r.deletedCount) deletedByCollection.institution_audit_logs = r.deletedCount;
      continue;
    }
    if (name === 'demo_requests') {
      const r = await DemoRequestModel.updateMany(
        { institutionId: oid },
        { $set: { institutionId: null } },
      ).exec();
      if (r.modifiedCount) deletedByCollection.demo_requests = r.modifiedCount;
      continue;
    }

    try {
      const result = await db.collection(name).deleteMany({ institutionId: oid });
      if (result.deletedCount > 0) {
        deletedByCollection[name] = result.deletedCount;
      }
    } catch {
      // Some collections may not support institutionId — skip.
    }
  }

  const inst = await InstitutionModel.deleteOne({ _id: oid }).exec();
  if (inst.deletedCount) deletedByCollection.institutions = inst.deletedCount;

  return { deletedByCollection };
}
