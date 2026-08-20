import type { NextFunction, Request, Response } from 'express';
import type {
  CreateTimetableInput,
  CreateTimetableSlotInput,
  TimetableListQuery,
  TimetableSlotListQuery,
  UpdateTimetableSlotInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import {
  timetableService,
  type ActorContext,
} from '../../services/timetable/timetable.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function listTimetables(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await timetableService.list(req.query as unknown as TimetableListQuery, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId, meta: data.meta });
  } catch (err) {
    next(err);
  }
}

export async function createTimetable(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await timetableService.create(req.body as CreateTimetableInput, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function publishTimetable(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await timetableService.publish(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listTimetableSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await timetableService.listSlots(
      req.params.id as string,
      req.query as unknown as TimetableSlotListQuery,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId, meta: data.meta });
  } catch (err) {
    next(err);
  }
}

export async function createTimetableSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await timetableService.createSlot(
      req.params.id as string,
      req.body as CreateTimetableSlotInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateTimetableSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await timetableService.updateSlot(
      req.params.id as string,
      req.body as UpdateTimetableSlotInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteTimetableSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await timetableService.deleteSlot(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function todayClasses(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await timetableService.today(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
