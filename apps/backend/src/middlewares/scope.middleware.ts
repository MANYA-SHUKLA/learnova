/**
 * Data-scope guards — tenant, faculty course assignment, student ownership.
 * Service-layer scoping remains authoritative; these block obvious param bypasses early.
 */

import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors/index.js';
import {
  facultyCanAccessCourse,
  facultyCanAccessStudent,
  resolveStudentSelfObjectId,
} from '../services/access/faculty-scope.js';
import { actorFromRequest, requireActorTenant } from '../utils/actor/index.js';
import { logAccessDenial } from '../services/audit/access-denial.js';

async function deny(
  req: Request,
  next: NextFunction,
  reason: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await logAccessDenial(req, reason, metadata);
  next(new ForbiddenError(reason));
}

/** Requires JWT institutionId — blocks cross-tenant API access at the edge. */
export function tenantGuard() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!req.user.institutionId) {
      void deny(req, next, 'Institution context required');
      return;
    }
    next();
  };
}

/** Faculty must be assigned to the course in :courseId (or query/body courseId). */
export function facultyCourseGuard(source: 'params' | 'query' | 'body' = 'params', key = 'courseId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    void (async () => {
      if (!req.user) {
        next(new UnauthorizedError());
        return;
      }
      if (req.user.role !== 'faculty' && req.user.role !== 'teaching_assistant') {
        next();
        return;
      }

      const actor = actorFromRequest(req);
      const institutionId = requireActorTenant(actor);
      const bag =
        source === 'params' ? req.params : source === 'query' ? req.query : req.body;
      const courseId = (bag as Record<string, unknown>)[key];
      if (!courseId || typeof courseId !== 'string') {
        next();
        return;
      }

      const allowed = await facultyCanAccessCourse(institutionId, actor.email, courseId);
      if (!allowed) {
        await deny(req, next, 'Not assigned to this course', { courseId });
        return;
      }
      next();
    })();
  };
}

/** Student role may only access their own student ERP id in :id / :studentId. */
export function studentOwnershipGuard(paramKey = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    void (async () => {
      if (!req.user) {
        next(new UnauthorizedError());
        return;
      }
      if (req.user.role !== 'student') {
        next();
        return;
      }

      const actor = actorFromRequest(req);
      const institutionId = requireActorTenant(actor);
      const studentId = req.params[paramKey];
      if (!studentId) {
        next();
        return;
      }

      const selfId = await resolveStudentSelfObjectId(institutionId, actor.email);
      if (!selfId || String(selfId) !== studentId) {
        await deny(req, next, 'Not allowed to access this student record', { studentId });
        return;
      }
      next();
    })();
  };
}

/** Faculty may only access students enrolled in their supervised courses. */
export function facultyStudentGuard(paramKey = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    void (async () => {
      if (!req.user) {
        next(new UnauthorizedError());
        return;
      }
      if (req.user.role !== 'faculty') {
        next();
        return;
      }

      const actor = actorFromRequest(req);
      const institutionId = requireActorTenant(actor);
      const studentId = req.params[paramKey];
      if (!studentId) {
        next();
        return;
      }

      const allowed = await facultyCanAccessStudent(institutionId, actor.email, studentId);
      if (!allowed) {
        await deny(req, next, 'Not allowed to access this student record', { studentId });
        return;
      }
      next();
    })();
  };
}
