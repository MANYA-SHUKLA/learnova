import type { NextFunction, Request, Response } from 'express';
import type {
  OpenLessonInput,
  CompleteLessonInput,
  UpdateLessonProgressInput,
  ResourceProgressUpdateInput,
  CreateBookmarkInput,
  CreateNoteInput,
  UpdateNoteInput,
  ProgressListQuery,
  BookmarkListQuery,
  NoteListQuery,
  ActivityListQuery,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import {
  progressService,
  type ActorContext,
} from '../../services/progress/progress.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function listMyProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await progressService.listMine(
      req.query as unknown as ProgressListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getCourseProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.getCourseDetail(
      req.params.courseId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getResume(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.getResume(
      req.params.courseId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function openLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.openLesson(
      req.body as OpenLessonInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function completeLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.completeLesson(
      req.body as CompleteLessonInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateLessonProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.updateLessonProgress(
      req.body as UpdateLessonProgressInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateResourceProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.updateResourceProgress(
      req.body as ResourceProgressUpdateInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function startSession(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.startSession(
      req.body as { courseId: string; lessonId?: string },
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function endSession(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.endSession(
      req.body as { sessionId: string; idleSeconds: number; activeSeconds?: number },
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listBookmarks(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await progressService.listBookmarks(
      req.query as unknown as BookmarkListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.createBookmark(
      req.body as CreateBookmarkInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.deleteBookmark(
      req.params.id as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await progressService.listNotes(
      req.query as unknown as NoteListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createNote(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.createNote(
      req.body as CreateNoteInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateNote(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.updateNote(
      req.params.id as string,
      req.body as UpdateNoteInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteNote(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.deleteNote(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function exportNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const format = (req.query.format as 'csv' | 'json' | undefined) ?? 'csv';
    const courseId = req.query.courseId as string | undefined;
    const data = await progressService.exportNotes(format, actorFrom(req), courseId);

    if (data.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="notes.csv"');
      res.status(200).send(data.data);
      return;
    }

    sendSuccess(res, { items: data.data }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await progressService.listActivity(
      req.query as unknown as ActivityListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function studentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.studentDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function facultyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = req.query.courseId as string | undefined;
    const data = await progressService.facultyDashboard(courseId, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function institutionDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.institutionDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getProgressStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await progressService.getStats(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function searchProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) ?? '';
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await progressService.search(q, page, limit, actorFrom(req));
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
