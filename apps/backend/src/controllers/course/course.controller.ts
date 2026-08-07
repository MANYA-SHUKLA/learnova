import type { NextFunction, Request, Response } from 'express';
import type {
  CreateCourseBody,
  ListCoursesQuery,
  UpdateCourseBody,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import { courseService } from '../../services/course/course.service.js';

function requireUser(req: Request) {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.institutionId) throw new UnauthorizedError('Institution context required');
  return {
    userId: req.user.sub,
    institutionId: req.user.institutionId,
  };
}

function paramId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string' || !id) {
    throw new UnauthorizedError('Invalid course id');
  }
  return id;
}

export async function getCourse(req: Request, res: Response, next: NextFunction) {
  try {
    requireUser(req);
    const course = await courseService.getCourse(paramId(req));
    sendSuccess(res, course, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const { institutionId } = requireUser(req);
    const result = await courseService.listCourses(
      req.query as unknown as ListCoursesQuery,
      institutionId,
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { institutionId, userId } = requireUser(req);
    const course = await courseService.createCourse(
      req.body as CreateCourseBody,
      institutionId,
      userId,
    );
    sendCreated(res, course, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = requireUser(req);
    const course = await courseService.updateCourse(
      paramId(req),
      req.body as UpdateCourseBody,
      userId,
    );
    sendSuccess(res, course, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteCourse(req: Request, res: Response, next: NextFunction) {
  try {
    requireUser(req);
    await courseService.deleteCourse(paramId(req));
    sendSuccess(res, { deleted: true }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function publishCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = requireUser(req);
    const course = await courseService.publishCourse(paramId(req), userId);
    sendSuccess(res, course, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = requireUser(req);
    const course = await courseService.archiveCourse(paramId(req), userId);
    sendSuccess(res, course, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getCourseStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { institutionId } = requireUser(req);
    const stats = await courseService.getCourseStats(institutionId);
    sendSuccess(res, stats, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
