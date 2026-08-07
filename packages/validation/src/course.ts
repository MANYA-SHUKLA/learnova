/**
 * Course Management Validation Schemas
 */

import { z } from 'zod';

const courseStatusEnum = z.enum(['draft', 'published', 'archived']);

const lessonContentTypeEnum = z.enum([
  'video',
  'pdf',
  'markdown',
  'html',
  'image',
  'audio',
  'link',
  'embed',
  'code',
  'download',
  'presentation',
]);

export const createCourseSchema = z.object({
  courseCode: z.string().min(1).max(100).trim(),
  title: z.string().min(1).max(500).trim(),
  slug: z.string().min(1).max(200).trim().toLowerCase(),
  description: z.string().min(1).max(5000).trim().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  programId: z.string().uuid().nullable().optional(),
  semesterId: z.string().uuid().nullable().optional(),
  credits: z.number().int().min(0).max(50).default(0),
  status: courseStatusEnum.default('draft'),
  facultyIds: z.array(z.string().uuid()).default([]),
  coordinatorId: z.string().uuid().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  objectives: z.array(z.string().trim()).default([]),
  prerequisites: z.array(z.string().trim()).default([]),
  syllabus: z.string().trim().nullable().optional(),
  tags: z.array(z.string().trim()).default([]),
  isActive: z.boolean().default(true),
});

export const updateCourseSchema = createCourseSchema.partial();

export const listCoursesSchema = z.object({
  q: z.string().trim().optional(),
  status: courseStatusEnum.optional(),
  departmentId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  semesterId: z.string().uuid().optional(),
  facultyId: z.string().uuid().optional(),
  tags: z.string().optional(),
  includeArchived: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const createModuleSchema = z.object({
  title: z.string().min(1).max(500).trim(),
  description: z.string().min(1).max(2000).trim().nullable().optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateModuleSchema = createModuleSchema.partial();

export const createLessonSchema = z.object({
  title: z.string().min(1).max(500).trim(),
  description: z.string().min(1).max(2000).trim().nullable().optional(),
  order: z.number().int().min(0).default(0),
  contentType: lessonContentTypeEnum,
  contentUrl: z.string().url().nullable().optional(),
  contentText: z.string().trim().nullable().optional(),
  contentMetadata: z.record(z.unknown()).default({}),
  durationMinutes: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateLessonSchema = createLessonSchema.partial();

export const updateProgressSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  timeSpentMinutes: z.number().min(0).optional(),
});

export const publishCourseSchema = z.object({
  publishedAt: z.string().datetime().optional(),
});

export const archiveCourseSchema = z.object({
  archivedAt: z.string().datetime().optional(),
});

export type CreateCourseBody = z.infer<typeof createCourseSchema>;
export type UpdateCourseBody = z.infer<typeof updateCourseSchema>;
export type ListCoursesQuery = z.infer<typeof listCoursesSchema>;
export type CreateModuleBody = z.infer<typeof createModuleSchema>;
export type UpdateModuleBody = z.infer<typeof updateModuleSchema>;
export type CreateLessonBody = z.infer<typeof createLessonSchema>;
export type UpdateLessonBody = z.infer<typeof updateLessonSchema>;
export type UpdateProgressBody = z.infer<typeof updateProgressSchema>;
