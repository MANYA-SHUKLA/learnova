import type { Types } from 'mongoose';
import {
  PasswordResetTokenModel,
  type PasswordResetTokenDocument,
} from '../../models/password-reset-token.model.js';
import {
  EmailVerificationTokenModel,
  type EmailVerificationTokenDocument,
} from '../../models/email-verification-token.model.js';

export class PasswordResetTokenRepository {
  async create(data: {
    userId: Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetTokenDocument> {
    return PasswordResetTokenModel.create(data);
  }

  async findValidByHash(tokenHash: string): Promise<PasswordResetTokenDocument | null> {
    return PasswordResetTokenModel.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    }).exec();
  }

  async markUsed(id: Types.ObjectId): Promise<void> {
    await PasswordResetTokenModel.findByIdAndUpdate(id, {
      $set: { usedAt: new Date() },
    }).exec();
  }

  async invalidateForUser(userId: string): Promise<void> {
    await PasswordResetTokenModel.updateMany(
      { userId, usedAt: null },
      { $set: { usedAt: new Date() } },
    ).exec();
  }
}

export class EmailVerificationTokenRepository {
  async create(data: {
    userId: Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<EmailVerificationTokenDocument> {
    return EmailVerificationTokenModel.create(data);
  }

  async findValidByHash(
    tokenHash: string,
  ): Promise<EmailVerificationTokenDocument | null> {
    return EmailVerificationTokenModel.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    }).exec();
  }

  async markUsed(id: Types.ObjectId): Promise<void> {
    await EmailVerificationTokenModel.findByIdAndUpdate(id, {
      $set: { usedAt: new Date() },
    }).exec();
  }

  async invalidateForUser(userId: string): Promise<void> {
    await EmailVerificationTokenModel.updateMany(
      { userId, usedAt: null },
      { $set: { usedAt: new Date() } },
    ).exec();
  }
}

export const passwordResetTokenRepository = new PasswordResetTokenRepository();
export const emailVerificationTokenRepository = new EmailVerificationTokenRepository();
