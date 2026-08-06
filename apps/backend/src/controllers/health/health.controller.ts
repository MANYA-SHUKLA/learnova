import type { Request, Response } from 'express';
import { isMongoReady, isRedisReady } from '../../database/index.js';
import { sendSuccess } from '../../utils/response/index.js';
import { appConfig } from '../../config/app.js';

export async function healthCheck(req: Request, res: Response): Promise<void> {
  const mongo = isMongoReady();
  const redis = await isRedisReady();

  const healthy = mongo && redis;
  const payload = {
    status: healthy ? 'ok' : 'degraded',
    service: appConfig.name,
    version: appConfig.version,
    checks: {
      mongo: mongo ? 'up' : 'down',
      redis: redis ? 'up' : 'down',
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
  if (!mongo || !redis) {
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
