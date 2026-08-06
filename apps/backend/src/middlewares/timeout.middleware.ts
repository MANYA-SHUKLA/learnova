import type { NextFunction, Request, Response } from 'express';
import { securityConfig } from '../config/slices.js';

/**
 * Request timeout — aborts long-running handlers.
 */
export function timeoutMiddleware(
  ms = securityConfig.requestTimeoutMs,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: `Request timed out after ${String(ms)}ms`,
          },
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        });
      }
    }, ms);

    const clear = () => { clearTimeout(timer); };
    res.on('finish', clear);
    res.on('close', clear);
    next();
  };
}
