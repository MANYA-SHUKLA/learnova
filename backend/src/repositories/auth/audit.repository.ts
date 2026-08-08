import type { Types } from 'mongoose';
import { LoginAttemptModel } from '../../models/login-attempt.model.js';
import {
  AuditAuthLogModel,
  type AuditAuthLogDocument,
} from '../../models/audit-auth-log.model.js';

export type AuthAuditEvent =
  | 'user.login'
  | 'user.login_failed'
  | 'user.logout'
  | 'user.logout_all'
  | 'user.registered'
  | 'password.changed'
  | 'password.reset_requested'
  | 'password.reset_completed'
  | 'email.verification_sent'
  | 'email.verified'
  | 'session.created'
  | 'session.revoked'
  | 'access.denied';

export class LoginAttemptRepository {
  async create(data: {
    email: string;
    ipAddress: string | null;
    userAgent: string | null;
    success: boolean;
    reason?: string | null;
    userId?: Types.ObjectId | null;
  }): Promise<void> {
    await LoginAttemptModel.create(data);
  }

  async countRecentFailures(email: string, since: Date): Promise<number> {
    return LoginAttemptModel.countDocuments({
      email: email.toLowerCase(),
      success: false,
      createdAt: { $gte: since },
    }).exec();
  }
}

export class AuditAuthLogRepository {
  async create(data: {
    event: AuthAuditEvent;
    userId?: Types.ObjectId | null;
    email?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
    correlationId?: string | null;
  }): Promise<AuditAuthLogDocument> {
    return AuditAuthLogModel.create(data);
  }
}

export const loginAttemptRepository = new LoginAttemptRepository();
export const auditAuthLogRepository = new AuditAuthLogRepository();
