import { z } from 'zod';
import { PAGINATION, REGEX } from '@learnova/constants';

const objectIdSchema = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');

const paginationShape = {
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
};

export const learningStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'completed',
  'paused',
]);

export const bookmarkTargetTypeSchema = z.enum(['module', 'lesson', 'resource']);

export const resumePositionSchema = z.object({
  scrollY: z.number().nullable().optional(),
  videoSeconds: z.number().nullable().optional(),
  markdownOffset: z.number().nullable().optional(),
  lastResourceId: objectIdSchema.nullable().optional(),
});

export const progressListQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  status: learningStatusSchema.optional(),
  courseId: objectIdSchema.optional(),
  studentId: objectIdSchema.optional(),
  bookmarked: z.coerce.boolean().optional(),
  recent: z.coerce.boolean().optional(),
  ...paginationShape,
});

export const courseProgressParamsSchema = z.object({
  courseId: objectIdSchema,
});

export const lessonProgressParamsSchema = z.object({
  lessonId: objectIdSchema,
});

export const moduleProgressParamsSchema = z.object({
  moduleId: objectIdSchema,
});

export const resourceProgressParamsSchema = z.object({
  resourceId: objectIdSchema,
});

export const openLessonSchema = z.object({
  courseId: objectIdSchema,
  moduleId: objectIdSchema,
  lessonId: objectIdSchema,
  position: z.number().min(0).optional(),
});

export const completeLessonSchema = z.object({
  courseId: objectIdSchema,
  moduleId: objectIdSchema,
  lessonId: objectIdSchema,
  watchPercentage: z.number().min(0).max(100).optional(),
  readingPercentage: z.number().min(0).max(100).optional(),
});

export const updateLessonProgressSchema = z.object({
  courseId: objectIdSchema,
  moduleId: objectIdSchema,
  lessonId: objectIdSchema,
  watchPercentage: z.number().min(0).max(100).optional(),
  readingPercentage: z.number().min(0).max(100).optional(),
  lastPosition: z.number().min(0).optional(),
  timeSpentSeconds: z.number().int().min(0).optional(),
  resumePosition: resumePositionSchema.optional(),
});

export const resourceProgressUpdateSchema = z.object({
  courseId: objectIdSchema,
  lessonId: objectIdSchema,
  resourceId: objectIdSchema,
  viewed: z.boolean().optional(),
  downloaded: z.boolean().optional(),
  completed: z.boolean().optional(),
  timeSpentSeconds: z.number().int().min(0).optional(),
});

export const startLearningSessionSchema = z.object({
  courseId: objectIdSchema,
  lessonId: objectIdSchema.optional(),
});

export const endLearningSessionSchema = z.object({
  sessionId: objectIdSchema,
  idleSeconds: z.number().int().min(0).default(0),
  activeSeconds: z.number().int().min(0).optional(),
});

export const createBookmarkSchema = z
  .object({
    courseId: objectIdSchema,
    targetType: bookmarkTargetTypeSchema,
    moduleId: objectIdSchema.optional(),
    lessonId: objectIdSchema.optional(),
    resourceId: objectIdSchema.optional(),
    note: z.string().trim().max(2000).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.targetType === 'module' && !val.moduleId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'moduleId required', path: ['moduleId'] });
    }
    if (val.targetType === 'lesson' && !val.lessonId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'lessonId required', path: ['lessonId'] });
    }
    if (val.targetType === 'resource' && !val.resourceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'resourceId required',
        path: ['resourceId'],
      });
    }
  });

export const bookmarkIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const bookmarkListQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  courseId: objectIdSchema.optional(),
  targetType: bookmarkTargetTypeSchema.optional(),
  ...paginationShape,
});

export const createNoteSchema = z.object({
  courseId: objectIdSchema,
  lessonId: objectIdSchema,
  text: z.string().trim().min(1).max(20_000),
});

export const updateNoteSchema = z.object({
  text: z.string().trim().min(1).max(20_000),
});

export const noteIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const noteListQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  courseId: objectIdSchema.optional(),
  lessonId: objectIdSchema.optional(),
  ...paginationShape,
});

export const activityListQuerySchema = z.object({
  courseId: objectIdSchema.optional(),
  studentId: objectIdSchema.optional(),
  type: z.string().optional(),
  ...paginationShape,
});

export const resumeLearningSchema = z.object({
  courseId: objectIdSchema,
  currentModuleId: objectIdSchema.nullable().optional(),
  currentLessonId: objectIdSchema.nullable().optional(),
  resumePosition: resumePositionSchema.optional(),
});

export type ProgressListQuery = z.infer<typeof progressListQuerySchema>;
export type OpenLessonInput = z.infer<typeof openLessonSchema>;
export type CompleteLessonInput = z.infer<typeof completeLessonSchema>;
export type UpdateLessonProgressInput = z.infer<typeof updateLessonProgressSchema>;
export type ResourceProgressUpdateInput = z.infer<typeof resourceProgressUpdateSchema>;
export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type ResumeLearningInput = z.infer<typeof resumeLearningSchema>;
export type BookmarkListQuery = z.infer<typeof bookmarkListQuerySchema>;
export type NoteListQuery = z.infer<typeof noteListQuerySchema>;
export type ActivityListQuery = z.infer<typeof activityListQuerySchema>;
export type StartLearningSessionInput = z.infer<typeof startLearningSessionSchema>;
export type EndLearningSessionInput = z.infer<typeof endLearningSessionSchema>;
