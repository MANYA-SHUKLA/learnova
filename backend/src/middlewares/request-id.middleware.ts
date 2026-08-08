import { HTTP_HEADERS } from '@learnova/shared';
import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(HTTP_HEADERS.REQUEST_ID);
  const requestId = incoming && incoming.length > 0 ? incoming : uuidv4();
  req.requestId = requestId;
  res.setHeader(HTTP_HEADERS.REQUEST_ID, requestId);
  next();
}
