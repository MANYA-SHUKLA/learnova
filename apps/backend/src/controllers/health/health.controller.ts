import type { Request, Response } from 'express';
import { isMongoReady, isRedisReady } from '../../database/index.js';
import { getStorage } from '../../storage/index.js';
import { getMailer } from '../../mail/index.js';
import { getQueueHealth } from '../../queues/index.js';
import { sendSuccess } from '../../utils/response/index.js';
import { appConfig } from '../../config/app.js';
import { env } from '../../config/env.js';

export async function healthCheck(req: Request, res: Response): Promise<void> {
  const mongo = isMongoReady();
  const redis = await isRedisReady();
  const storage = await getStorage().isHealthy();
  const mail = await getMailer().isHealthy();

  let queues: Record<string, { waiting: number; active: number }> | 'unavailable' =
    'unavailable';
  try {
    queues = await getQueueHealth();
  } catch {
    queues = 'unavailable';
  }

  const healthy = mongo && redis && storage;
  const payload = {
    status: healthy ? 'ok' : 'degraded',
    service: appConfig.name,
    version: appConfig.version,
    checks: {
      mongo: mongo ? 'up' : 'down',
      redis: redis ? 'up' : 'down',
      storage: storage ? 'up' : 'down',
      mail: mail ? 'up' : 'down',
      queues,
    },
    drivers: {
      storage: env.STORAGE_DRIVER ?? 'local',
      mail: env.MAIL_DRIVER ?? 'console',
    },
    uptime: process.uptime(),
  };

  sendSuccess(res, payload, {
    status: healthy ? 200 : 503,
    requestId: req.requestId,
  });
}

export async function readinessCheck(req: Request, res: Response): Promise<void> {
  const mongo = isMongoReady();
  const redis = await isRedisReady();
  const storage = await getStorage().isHealthy();
  if (!mongo || !redis || !storage) {
    sendSuccess(
      res,
      { ready: false },
      { status: 503, requestId: req.requestId },
    );
    return;
  }
  sendSuccess(res, { ready: true }, { requestId: req.requestId });
}

export function livenessCheck(req: Request, res: Response): void {
  sendSuccess(res, { alive: true }, { requestId: req.requestId });
}
