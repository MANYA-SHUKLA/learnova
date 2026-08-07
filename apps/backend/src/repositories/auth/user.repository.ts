import type { Types } from 'mongoose';
import { UserModel, type UserDocument } from '../../models/user.model.js';

export type UserEntity = UserDocument;

export class UserRepository {
  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleId: Types.ObjectId;
    institutionId: Types.ObjectId;
    isEmailVerified?: boolean;
    passwordHistory?: string[];
    lastPasswordChangedAt?: Date;
    lastLoginAt?: Date;
  }): Promise<UserEntity> {
    return UserModel.create(data);
  }

  async findById(id: string): Promise<UserEntity | null> {
    return UserModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async updateById(
    id: string,
    data: Partial<{
      passwordHash: string;
      passwordHistory: string[];
      isActive: boolean;
      isEmailVerified: boolean;
      failedLoginAttempts: number;
      lockedUntil: Date | null;
      lastLoginAt: Date;
      lastPasswordChangedAt: Date;
      tokenVersion: number;
      firstName: string;
      lastName: string;
      locale: string;
      avatarUrl: string | null;
    }>,
  ): Promise<UserEntity | null> {
    return UserModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async incrementFailedAttempts(id: string): Promise<UserEntity | null> {
    return UserModel.findByIdAndUpdate(
      id,
      { $inc: { failedLoginAttempts: 1 } },
      { new: true },
    ).exec();
  }

  async resetFailedAttempts(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: { failedLoginAttempts: 0, lockedUntil: null },
    }).exec();
  }

  async bumpTokenVersion(id: string): Promise<number> {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { $inc: { tokenVersion: 1 } },
      { new: true },
    ).exec();
    return user?.tokenVersion ?? 0;
  }
}

export const userRepository = new UserRepository();
