import { z } from 'zod';
import { REGEX } from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');
const optionalString = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const courseModuleStatusSchema = z.enum([
  'draft',
  'published',
  'hidden',
  'archived',
]);

export const courseModuleVisibilitySchema = z.enum([
  'private',
  'enrolled',
  'public',
]);

export const courseLessonStatusSchema = z.enum([
  'draft',
  'published',
  'hidden',
  'archived',
]);

export const courseLessonVisibilitySchema = z.enum([
  'private',
  'enrolled',
  'public',
  'preview',
]);

export const courseLessonTypeSchema = z.enum([
  'video',
  'pdf',
  'markdown',
  'rich_text',
  'html',
  'external_link',
  'code_snippet',
  'image',
  'audio',
  'presentation',
  'download',
]);

export const courseResourceTypeSchema = z.enum([
  'pdf',
  'video',
  'image',
  'audio',
  'zip',
  'markdown',
  'html',
  'external_link',
  'presentation',
]);

export const courseResourceVisibilitySchema = z.enum([
  'private',
  'enrolled',
  'public',
]);

export const builderCourseParamsSchema = z.object({
  courseId: objectIdField,
});

export const builderModuleParamsSchema = z.object({
  courseId: objectIdField,
  moduleId: objectIdField,
});

export const builderLessonParamsSchema = z.object({
  courseId: objectIdField,
  lessonId: objectIdField,
});

export const builderResourceParamsSchema = z.object({
  courseId: objectIdField,
  lessonId: objectIdField,
  resourceId: objectIdField,
});

const moduleBase = {
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug')
    .optional(),
  description: optionalString(5000),
  moduleNumber: z.coerce.number().int().min(1).max(9999).optional(),
  orderIndex: z.coerce.number().int().min(0).optional(),
  estimatedMinutes: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  visibility: courseModuleVisibilitySchema.optional().default('enrolled'),
  status: courseModuleStatusSchema.optional().default('draft'),
  icon: optionalString(80),
  color: optionalString(32),
  isLocked: z.boolean().optional().default(false),
  unlockAfterModuleId: objectIdField.optional().nullable(),
};

export const createCourseModuleSchema = z.object(moduleBase);

export const updateCourseModuleSchema = z.object(moduleBase).partial();

const lessonBase = {
  moduleId: objectIdField,
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug')
    .optional(),
  lessonNumber: z.coerce.number().int().min(1).max(9999).optional(),
  orderIndex: z.coerce.number().int().min(0).optional(),
  description: optionalString(5000),
  summary: optionalString(1000),
  content: optionalString(500000),
  estimatedMinutes: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  visibility: courseLessonVisibilitySchema.optional().default('enrolled'),
  status: courseLessonStatusSchema.optional().default('draft'),
  lessonType: courseLessonTypeSchema.optional().default('rich_text'),
  allowComments: z.boolean().optional().default(true),
  allowDownloads: z.boolean().optional().default(true),
  isPreview: z.boolean().optional().default(false),
  isLocked: z.boolean().optional().default(false),
  unlockAfterLessonId: objectIdField.optional().nullable(),
};

export const createCourseLessonSchema = z.object(lessonBase);

export const updateCourseLessonSchema = z
  .object({
    ...lessonBase,
    moduleId: objectIdField.optional(),
  })
  .partial();

export const createCourseResourceSchema = z.object({
  type: courseResourceTypeSchema,
  title: z.string().trim().min(1).max(200),
  description: optionalString(2000),
  url: z.string().url().max(2000).optional().nullable(),
  fileName: optionalString(260),
  mimeType: optionalString(120),
  size: z.coerce.number().int().min(0).max(200 * 1024 * 1024).optional().nullable(),
  orderIndex: z.coerce.number().int().min(0).optional(),
  visibility: courseResourceVisibilitySchema.optional().default('enrolled'),
  contentType: z
    .enum([
      'application/pdf',
      'application/zip',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'audio/mpeg',
      'audio/wav',
      'text/markdown',
      'text/html',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/octet-stream',
    ])
    .optional(),
  data: z.string().min(1).max(30_000_000).optional(),
});

export const updateCourseResourceSchema = createCourseResourceSchema.partial();

export const builderReorderSchema = z.object({
  modules: z
    .array(
      z.object({
        id: objectIdField,
        orderIndex: z.coerce.number().int().min(0),
      }),
    )
    .max(500)
    .optional()
    .default([]),
  lessons: z
    .array(
      z.object({
        id: objectIdField,
        moduleId: objectIdField,
        orderIndex: z.coerce.number().int().min(0),
      }),
    )
    .max(5000)
    .optional()
    .default([]),
  resources: z
    .array(
      z.object({
        id: objectIdField,
        lessonId: objectIdField,
        orderIndex: z.coerce.number().int().min(0),
      }),
    )
    .max(5000)
    .optional()
    .default([]),
});

export const builderSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  lessonType: courseLessonTypeSchema.optional(),
  status: courseLessonStatusSchema.optional(),
  isLocked: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  isPreview: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const moveLessonSchema = z.object({
  moduleId: objectIdField,
  orderIndex: z.coerce.number().int().min(0).optional(),
});

export type CreateCourseModuleInput = z.infer<typeof createCourseModuleSchema>;
export type UpdateCourseModuleInput = z.infer<typeof updateCourseModuleSchema>;
export type CreateCourseLessonInput = z.infer<typeof createCourseLessonSchema>;
export type UpdateCourseLessonInput = z.infer<typeof updateCourseLessonSchema>;
export type CreateCourseResourceInput = z.infer<typeof createCourseResourceSchema>;
export type UpdateCourseResourceInput = z.infer<typeof updateCourseResourceSchema>;
export type BuilderReorderInput = z.infer<typeof builderReorderSchema>;
export type BuilderSearchQuery = z.infer<typeof builderSearchQuerySchema>;
export type MoveLessonInput = z.infer<typeof moveLessonSchema>;
