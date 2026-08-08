import type { NextFunction, Request, Response } from 'express';
import type { ReportsExportQuery, ReportsQuery } from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendSuccess } from '../../utils/response/index.js';
import { reportsService, type ActorContext } from '../../services/reports/reports.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function institutionReport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await reportsService.institutionReport(
      req.query as unknown as ReportsQuery,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function facultyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await reportsService.facultyReport(
      req.query as unknown as ReportsQuery,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function studentReport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await reportsService.studentReport(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function exportReport(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reportsService.exportReport(
      req.query as unknown as ReportsExportQuery,
      actorFrom(req),
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.body);
  } catch (err) {
    next(err);
  }
}
