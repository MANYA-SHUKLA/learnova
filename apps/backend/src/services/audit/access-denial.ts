import type { Request } from 'express';
import { Types } from 'mongoose';
import { auditAuthLogRepository } from '../../repositories/auth/index.js';
import { logger } from '../../utils/logger/index.js';

/** Best-effort audit trail for permission / role / ownership denials. */
export async function logAccessDenial(
  req: Request,
  reason: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const user = req.user;
  const payload = {
    reason,
    path: req.path,
    method: req.method,
    role: user?.role,
    email: user?.email,
    institutionId: user?.institutionId,
    ...metadata,
  };

  logger.warn(payload, 'Access denied');

  if (!user?.sub) return;

  try {
    await auditAuthLogRepository.create({
      event: 'access.denied',
      userId: new Types.ObjectId(user.sub),
      email: user.email,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      correlationId: (req.requestId as string | undefined) ?? null,
      metadata: payload,
    });
  } catch (err) {
    logger.debug({ err }, 'Failed to persist access denial audit');
  }
}
