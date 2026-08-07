import type { NextFunction, Request, Response } from 'express';
import type {
  AssignProjectGradeInput,
  FinalizeCourseGradesInput,
  GradebookListQuery,
  IngestGradebookSourceInput,
  SyncCourseGradebookInput,
  UpsertWeightSchemeInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import { gradebookService, type ActorContext } from '../../services/gradebook/gradebook.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function listEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await gradebookService.listEntries(
      req.query as unknown as GradebookListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getCourseEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.query.studentId as string | undefined;
    const result = await gradebookService.getCourseEntries(
      req.params.courseId as string,
      actorFrom(req),
      studentId,
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getCourseSummaries(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.query.studentId as string | undefined;
    const items = await gradebookService.getCourseSummaries(
      req.params.courseId as string,
      actorFrom(req),
      studentId,
    );
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getWeightScheme(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.getWeightScheme(req.params.courseId as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function upsertWeightScheme(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.upsertWeightScheme(
      req.body as UpsertWeightSchemeInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function ingestSource(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.ingestSource(
      req.body as IngestGradebookSourceInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function syncCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.syncCourse(
      req.body as SyncCourseGradebookInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function assignProjectGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.assignProjectGrade(
      req.body as AssignProjectGradeInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function finalizeCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.finalizeCourse(
      req.body as FinalizeCourseGradesInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function institutionDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = req.query.courseId as string | undefined;
    const data = await gradebookService.institutionDashboard(courseId, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function facultyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = req.query.courseId as string | undefined;
    const data = await gradebookService.facultyDashboard(courseId, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function studentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gradebookService.studentDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listPendingProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await gradebookService.listPendingProjects(
      req.params.courseId as string,
      actorFrom(req),
    );
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
