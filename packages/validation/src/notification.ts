import { z } from 'zod';
import { NOTIFICATION_TYPES, PAGINATION, REGEX } from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');

export const notificationListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
});

export const notificationIdParamsSchema = z.object({
  notificationId: objectIdField,
});

export const createCourseAnnouncementSchema = z.object({
  courseId: objectIdField,
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
export type CreateCourseAnnouncementInput = z.infer<typeof createCourseAnnouncementSchema>;

export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
