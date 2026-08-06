import type { Request, Response } from 'express';
import {
  getMongoMetrics,
  isMongoLive,
  isMongoReady,
  getRedisMetrics,
  isRedisReady,
} from '../../database/index.js';
import { getStorage } from '../../storage/index.js';
import { getMailer } from '../../mail/index.js';
import { getQueueHealth } from '../../queues/index.js';
import { collectMetrics } from '../../monitoring/metrics.js';
import { sendSuccess } from '../../utils/response/index.js';
import { appConfig } from '../../config/app.js';
import { env } from '../../config/env.js';

export async function healthCheck(req: Request, res: Response): Promise<void> {
  const mongo = isMongoReady();
  const redis = await isRedisReady();
  const storage = await getStorage().isHealthy();
  const mail = await getMailer().isHealthy();
  const metrics = collectMetrics();

  let queues: Awaited<ReturnType<typeof getQueueHealth>> | 'unavailable' = 'unavailable';
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
    commit: appConfig.commitSha,
    environment: appConfig.env,
    uptime: process.uptime(),
    memory: metrics.memory,
    cpu: metrics.cpu,
    checks: {
      database: mongo ? 'up' : 'down',
      mongo: mongo ? 'up' : 'down',
      redis: redis ? 'up' : 'down',
      storage: storage ? 'up' : 'down',
      mail: mail ? 'up' : 'down',
      queue: queues,
    },
    drivers: {
      storage: env.STORAGE_DRIVER ?? 'local',
      mail: env.MAIL_DRIVER ?? 'console',
    },
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
  const ready = mongo && redis && storage;
  sendSuccess(
    res,
    {
      ready,
      database: mongo,
      redis,
      storage,
    },
    { status: ready ? 200 : 503, requestId: req.requestId },
  );
}

export function livenessCheck(req: Request, res: Response): void {
  sendSuccess(
    res,
    {
      alive: true,
      databaseLive: isMongoLive(),
      redis: getRedisMetrics().status,
    },
    { requestId: req.requestId },
  );
}

export function versionCheck(req: Request, res: Response): void {
  sendSuccess(
    res,
    {
      service: appConfig.name,
      version: appConfig.version,
      commit: appConfig.commitSha,
      environment: appConfig.env,
      node: process.version,
      mongo: getMongoMetrics(),
    },
    { requestId: req.requestId },
  );
}
