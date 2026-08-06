import type { Types } from 'mongoose';
import { SessionModel, type SessionDocument } from '../../models/session.model.js';
import type { DeviceType } from '@learnova/types';

export class SessionRepository {
  async create(data: {
    userId: Types.ObjectId;
    deviceType: DeviceType;
    ipAddress: string | null;
    userAgent: string | null;
    browser: string | null;
    os: string | null;
    country: string | null;
    expiresAt: Date;
  }): Promise<SessionDocument> {
    return SessionModel.create(data);
  }

  async findById(id: string): Promise<SessionDocument | null> {
    return SessionModel.findById(id).exec();
  }

  async findActiveByUser(userId: string): Promise<SessionDocument[]> {
    return SessionModel.find({
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastActivityAt: -1 })
      .exec();
  }

  async touch(id: string): Promise<void> {
    await SessionModel.findByIdAndUpdate(id, {
      $set: { lastActivityAt: new Date() },
    }).exec();
  }

  async revoke(id: string): Promise<SessionDocument | null> {
    return SessionModel.findByIdAndUpdate(
      id,
      { $set: { revokedAt: new Date() } },
      { new: true },
    ).exec();
  }

  async revokeAllForUser(userId: string): Promise<number> {
    const result = await SessionModel.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    ).exec();
    return result.modifiedCount;
  }
}

export const sessionRepository = new SessionRepository();
