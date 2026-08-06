import { z } from 'zod';
import {
  PAGINATION,
  REGEX,
  ROLES,
  SUPPORTED_LOCALES,
} from '@learnova/constants';

export const objectIdSchema = z
  .string()
  .regex(REGEX.OBJECT_ID, 'Invalid ObjectId');

export const uuidSchema = z.string().regex(REGEX.UUID, 'Invalid UUID');

export const emailSchema = z.string().email().toLowerCase().trim();

export const localeSchema = z.enum(SUPPORTED_LOCALES);

export const roleSchema = z.enum([
  ROLES.STUDENT,
  ROLES.FACULTY,
  ROLES.INSTITUTION_ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.TEACHING_ASSISTANT,
  ROLES.PLACEMENT_OFFICER,
  ROLES.PARENT,
]);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  ...paginationSchema.shape,
});

export const slugSchema = z.string().regex(REGEX.SLUG, 'Invalid slug');

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
