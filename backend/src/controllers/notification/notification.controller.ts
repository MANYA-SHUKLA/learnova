import type { NextFunction, Request, Response } from 'express';
import type { CreateCourseAnnouncementInput, NotificationListQuery } from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import {
  notificationService,
  type ActorContext,
} from '../../services/notification/notification.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await notificationService.list(
      req.query as unknown as NotificationListQuery,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId, meta: data.meta });
  } catch (err) {
    next(err);
  }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await notificationService.unreadCount(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await notificationService.markRead(req.params.notificationId as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await notificationService.markAllRead(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await notificationService.deleteNotification(
      req.params.notificationId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createCourseAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await notificationService.createCourseAnnouncement(
      req.body as CreateCourseAnnouncementInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
