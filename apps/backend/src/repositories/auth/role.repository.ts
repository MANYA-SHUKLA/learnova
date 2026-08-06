import { RoleModel, type RoleDocument } from '../../models/role.model.js';
import { PermissionModel, type PermissionDocument } from '../../models/permission.model.js';
import type { Types } from 'mongoose';
import type { Role } from '@learnova/types';

export class RoleRepository {
  async findByName(name: Role): Promise<RoleDocument | null> {
    return RoleModel.findOne({ name }).exec();
  }

  async findById(id: string): Promise<RoleDocument | null> {
    return RoleModel.findById(id).exec();
  }

  async findAll(): Promise<RoleDocument[]> {
    return RoleModel.find().exec();
  }

  async upsert(data: {
    name: Role;
    label: string;
    description: string;
    permissionIds: Types.ObjectId[];
    isActive: boolean;
  }): Promise<RoleDocument> {
    const doc = await RoleModel.findOneAndUpdate(
      { name: data.name },
      { $set: data },
      { upsert: true, new: true },
    ).exec();
    if (!doc) {
      throw new Error('Failed to upsert role');
    }
    return doc;
  }
}

export class PermissionRepository {
  async findByName(name: string): Promise<PermissionDocument | null> {
    return PermissionModel.findOne({ name }).exec();
  }

  async findByNames(names: string[]): Promise<PermissionDocument[]> {
    return PermissionModel.find({ name: { $in: names } }).exec();
  }

  async findAll(): Promise<PermissionDocument[]> {
    return PermissionModel.find().exec();
  }

  async upsert(data: {
    name: string;
    resource: string;
    action: string;
    description: string;
  }): Promise<PermissionDocument> {
    const doc = await PermissionModel.findOneAndUpdate(
      { name: data.name },
      { $set: data },
      { upsert: true, new: true },
    ).exec();
    if (!doc) {
      throw new Error('Failed to upsert permission');
    }
    return doc;
  }
}

export const roleRepository = new RoleRepository();
export const permissionRepository = new PermissionRepository();
