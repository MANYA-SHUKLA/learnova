import type { NextFunction, Request, Response } from 'express';
import { recordResponseTime } from '../monitoring/metrics.js';

/** Records response duration for monitoring averages */
export function metricsMiddleware(_req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1_000_000;
    recordResponseTime(ms);
  });
  next();
}
