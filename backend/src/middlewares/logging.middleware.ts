import type { NextFunction, Request, Response } from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from '../utils/logger/index.js';

export const httpLogger = pinoHttp({
  logger: logger.raw,
  genReqId: (req) => (req as Request).requestId,
  customProps: (req) => ({
    requestId: (req as Request).requestId,
  }),
  autoLogging: {
    ignore: (req) =>
      req.url === '/api/v1/health' ||
      req.url === '/api/internal/health' ||
      req.url === '/api/webhooks/health' ||
      req.url === '/health',
  },
});

export function notFoundMiddleware(_req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
    requestId: res.getHeader('x-request-id') ?? '',
    timestamp: new Date().toISOString(),
  });
}
