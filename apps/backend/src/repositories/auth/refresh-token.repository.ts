import type { Types } from 'mongoose';
import {
  RefreshTokenModel,
  type RefreshTokenDocument,
} from '../../models/refresh-token.model.js';

export class RefreshTokenRepository {
  async create(data: {
    userId: Types.ObjectId;
    tokenHash: string;
    familyId: string;
    version: number;
    sessionId: Types.ObjectId;
    expiresAt: Date;
    userAgent: string | null;
    ipAddress: string | null;
  }): Promise<RefreshTokenDocument> {
    return RefreshTokenModel.create(data);
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenDocument | null> {
    return RefreshTokenModel.findOne({ tokenHash }).exec();
  }

  async findActiveByFamily(familyId: string): Promise<RefreshTokenDocument[]> {
    return RefreshTokenModel.find({
      familyId,
      revokedAt: null,
    }).exec();
  }

  async revoke(id: Types.ObjectId, replacedByTokenId?: Types.ObjectId): Promise<void> {
    await RefreshTokenModel.findByIdAndUpdate(id, {
      $set: {
        revokedAt: new Date(),
        ...(replacedByTokenId ? { replacedByTokenId } : {}),
      },
    }).exec();
  }

  async revokeFamily(familyId: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    ).exec();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    ).exec();
  }

  async revokeBySession(sessionId: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { sessionId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    ).exec();
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
