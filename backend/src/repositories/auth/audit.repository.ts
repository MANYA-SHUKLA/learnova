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

  /** Successful institution admin sign-ins at `/login` (excludes faculty, student, super admin). */
  async listInstitutionAdminLogins(query: { page: number; limit: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const skip = (page - 1) * limit;
    const baseStages = [
      { $match: { event: 'user.login' } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'roles',
          localField: 'user.roleId',
          foreignField: '_id',
          as: 'role',
        },
      },
      { $unwind: { path: '$role', preserveNullAndEmptyArrays: false } },
      { $match: { 'role.name': 'institution_admin' } },
    ];

    const [items, countRows] = await Promise.all([
      AuditAuthLogModel.aggregate([
        ...baseStages,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'institutions',
            localField: 'user.institutionId',
            foreignField: '_id',
            as: 'institution',
          },
        },
        {
          $project: {
            _id: 1,
            email: { $ifNull: ['$email', '$user.email'] },
            institutionId: '$user.institutionId',
            institutionName: { $arrayElemAt: ['$institution.name', 0] },
            loggedInAt: '$createdAt',
            ipAddress: '$ipAddress',
          },
        },
      ]).exec(),
      AuditAuthLogModel.aggregate([...baseStages, { $count: 'total' }]).exec(),
    ]);

    const total = (countRows[0] as { total?: number } | undefined)?.total ?? 0;
    return { items, total, page, limit };
  }
}

export const loginAttemptRepository = new LoginAttemptRepository();
export const auditAuthLogRepository = new AuditAuthLogRepository();
