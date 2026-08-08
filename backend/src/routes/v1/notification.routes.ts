import { Router, type RequestHandler } from 'express';
import {
  createCourseAnnouncementSchema,
  notificationIdParamsSchema,
  notificationListQuerySchema,
} from '@learnova/validation';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/notification/notification.controller.js';

const notificationRoutes = Router();

const auth = [authenticate({ required: true })] as RequestHandler[];

notificationRoutes.get(
  '/notifications',
  ...auth,
  validate(notificationListQuerySchema, 'query'),
  ctrl.listNotifications,
);

notificationRoutes.get('/notifications/unread-count', ...auth, ctrl.unreadCount);

notificationRoutes.post(
  '/notifications/read-all',
  ...auth,
  ctrl.markAllRead,
);

notificationRoutes.post(
  '/notifications/:notificationId/read',
  ...auth,
  validate(notificationIdParamsSchema, 'params'),
  ctrl.markRead,
);

notificationRoutes.delete(
  '/notifications/:notificationId',
  ...auth,
  validate(notificationIdParamsSchema, 'params'),
  ctrl.deleteNotification,
);

notificationRoutes.post(
  '/notifications/announcements',
  ...auth,
  validate(createCourseAnnouncementSchema),
  ctrl.createCourseAnnouncement,
);

export default notificationRoutes;
