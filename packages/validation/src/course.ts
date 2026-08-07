import { z } from 'zod';
import { PAGINATION, REGEX } from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');
const optionalString = (max: number) => z.string().trim().max(max).optional().nullable();
const optionalUrl = z.string().url().optional().nullable();
const stringList = (maxItems: number, maxLen: number) =>
  z.array(z.string().trim().min(1).max(maxLen)).max(maxItems).optional().default([]);

export const courseStatusSchema = z.enum([
  'draft',
  'review',
  'published',
  'archived',
  'scheduled',
]);

export const courseVisibilitySchema = z.enum([
  'private',
  'institution',
  'public',
  'invite_only',
]);

export const courseDifficultySchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]);

export const courseCategorySchema = z.enum([
  'programming',
  'cyber_security',
  'ai',
  'cloud',
  'networking',
  'database',
  'electronics',
  'mechanical',
  'mathematics',
  'general',
  'custom',
]);

export const courseEnrollmentModeSchema = z.enum([
  'open',
  'approval',
  'invite',
  'closed',
]);

export const courseListQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  status: courseStatusSchema.optional(),
  visibility: courseVisibilitySchema.optional(),
  difficulty: courseDifficultySchema.optional(),
  category: courseCategorySchema.optional(),
  language: z.string().trim().min(2).max(16).optional(),
  campusId: objectIdField.optional(),
  schoolId: objectIdField.optional(),
  departmentId: objectIdField.optional(),
  programId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
  facultyId: objectIdField.optional(),
  creditsMin: z.coerce.number().min(0).max(50).optional(),
  creditsMax: z.coerce.number().min(0).max(50).optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'credits', 'estimatedHours', 'courseCode'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const courseSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
});

export const courseIdParamsSchema = z.object({
  id: objectIdField,
});

const courseBaseFields = {
  courseCode: z.string().trim().min(1).max(64),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug'),
  title: z.string().trim().min(1).max(200),
  subtitle: optionalString(200),
  description: optionalString(10000),
  shortDescription: optionalString(500),
  thumbnail: optionalUrl,
  banner: optionalUrl,
  icon: optionalUrl,
  campusId: objectIdField.optional().nullable(),
  schoolId: objectIdField.optional().nullable(),
  departmentId: objectIdField.optional().nullable(),
  programIds: z.array(objectIdField).max(50).optional().default([]),
  semesterIds: z.array(objectIdField).max(50).optional().default([]),
  facultyIds: z.array(objectIdField).max(50).optional().default([]),
  coordinatorId: objectIdField.optional().nullable(),
  category: courseCategorySchema.optional().default('general'),
  difficulty: courseDifficultySchema.optional().default('beginner'),
  language: z.string().trim().min(2).max(16).optional().default('en'),
  credits: z.coerce.number().min(0).max(50).optional().default(0),
  estimatedHours: z.coerce.number().min(0).max(2000).optional().nullable(),
  duration: optionalString(80),
  status: courseStatusSchema.optional().default('draft'),
  visibility: courseVisibilitySchema.optional().default('institution'),
  version: z.coerce.number().int().min(1).optional().default(1),
  tags: stringList(40, 60),
  learningObjectives: stringList(50, 300),
  prerequisites: stringList(50, 300),
  requirements: stringList(50, 300),
  outcomes: stringList(50, 300),
  skills: stringList(50, 120),
  certificateEnabled: z.boolean().optional().default(false),
  discussionEnabled: z.boolean().optional().default(true),
  allowDownloads: z.boolean().optional().default(true),
  allowPreview: z.boolean().optional().default(false),
  maxStudents: z.coerce.number().int().min(1).max(100000).optional().nullable(),
  enrollmentMode: courseEnrollmentModeSchema.optional().default('open'),
  enrollmentDeadline: z.coerce.date().optional().nullable(),
  waitlistEnabled: z.boolean().optional().default(false),
  publishDate: z.coerce.date().optional().nullable(),
  archiveDate: z.coerce.date().optional().nullable(),
  seoTitle: optionalString(120),
  seoDescription: optionalString(300),
  seoKeywords: stringList(30, 60),
};

export const createCourseSchema = z.object(courseBaseFields);

export const updateCourseSchema = z.object(courseBaseFields).partial();

export const courseBulkIdsSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
});

export const courseBulkStatusSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  status: courseStatusSchema,
});

export const courseBulkAssignFacultySchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  facultyIds: z.array(objectIdField).min(1).max(50),
  mode: z.enum(['replace', 'append']).optional().default('append'),
  coordinatorId: objectIdField.optional().nullable(),
});

export const courseBulkAssignProgramSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  programIds: z.array(objectIdField).min(1).max(50),
  mode: z.enum(['replace', 'append']).optional().default('append'),
});

export const courseBulkAssignSemesterSchema = z.object({
  ids: z.array(objectIdField).min(1).max(500),
  semesterIds: z.array(objectIdField).min(1).max(50),
  mode: z.enum(['replace', 'append']).optional().default('append'),
});

export const courseImportConfirmSchema = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(2000),
  dryRun: z.boolean().optional().default(false),
});

export const courseExportQuerySchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf']).optional().default('csv'),
  q: z.string().trim().min(1).max(200).optional(),
  status: courseStatusSchema.optional(),
  visibility: courseVisibilitySchema.optional(),
  difficulty: courseDifficultySchema.optional(),
  category: courseCategorySchema.optional(),
  departmentId: objectIdField.optional(),
  programId: objectIdField.optional(),
  facultyId: objectIdField.optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

export const courseThumbnailUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  data: z.string().min(32).max(5_000_000),
});

export type CourseListQuery = z.infer<typeof courseListQuerySchema>;
export type CourseSearchQuery = z.infer<typeof courseSearchQuerySchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseBulkIdsInput = z.infer<typeof courseBulkIdsSchema>;
export type CourseBulkStatusInput = z.infer<typeof courseBulkStatusSchema>;
export type CourseBulkAssignFacultyInput = z.infer<typeof courseBulkAssignFacultySchema>;
export type CourseBulkAssignProgramInput = z.infer<typeof courseBulkAssignProgramSchema>;
export type CourseBulkAssignSemesterInput = z.infer<typeof courseBulkAssignSemesterSchema>;
export type CourseImportConfirmInput = z.infer<typeof courseImportConfirmSchema>;
export type CourseExportQuery = z.infer<typeof courseExportQuerySchema>;
export type CourseThumbnailUploadInput = z.infer<typeof courseThumbnailUploadSchema>;

/** @deprecated Use CreateCourseInput */
export type CreateCourseBody = CreateCourseInput;
/** @deprecated Use UpdateCourseInput */
export type UpdateCourseBody = UpdateCourseInput;
/** @deprecated Use CourseListQuery */
export type ListCoursesQuery = CourseListQuery;
