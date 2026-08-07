import { z } from 'zod';
import { ASSESSMENT_MAX_FILE_BYTES, REGEX } from '@learnova/constants';
import {
  assessmentAttemptStatusSchema,
  assessmentDeliveryTypeSchema,
  assessmentFileUploadSchema,
  assessmentGradeInputSchema,
  assessmentGradingMethodSchema,
  assessmentLifecycleStatusSchema,
  assessmentVisibilitySchema,
} from './assessment.js';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');
const optionalString = (max: number) => z.string().trim().max(max).optional().nullable();

export const assignmentTypeSchema = z.enum([
  'homework',
  'essay',
  'research',
  'presentation',
  'case_study',
  'document_upload',
  'pdf_upload',
  'image_upload',
  'video_upload',
  'mixed',
]);

/** Assignment lifecycle/status = Assessment Core lifecycle */
export const assignmentStatusSchema = assessmentLifecycleStatusSchema;
export const assignmentVisibilitySchema = assessmentVisibilitySchema;
export const assignmentSubmissionStatusSchema = assessmentAttemptStatusSchema;
export const assignmentSubmissionTypeSchema = assessmentDeliveryTypeSchema.extract([
  'text',
  'file',
  'link',
  'mixed',
]);
export const assignmentGradingMethodSchema = assessmentGradingMethodSchema.extract([
  'manual',
  'rubric',
  'pass_fail',
  'marks',
  'percentage',
]);

/** @deprecated Prefer ASSESSMENT_MAX_FILE_BYTES — kept for assignment callers */
export const ASSIGNMENT_MAX_FILE_BYTES = ASSESSMENT_MAX_FILE_BYTES;

export const assignmentAllowedContentTypes = assessmentFileUploadSchema.shape.contentType.options;

export const assignmentFileUploadSchema = assessmentFileUploadSchema;

export const assignmentListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  courseId: objectIdField.optional(),
  moduleId: objectIdField.optional(),
  lessonId: objectIdField.optional(),
  status: assignmentStatusSchema.optional(),
  assignmentType: assignmentTypeSchema.optional(),
  published: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  due: z
    .enum(['upcoming', 'overdue', 'none'])
    .optional(),
  late: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  graded: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  studentId: objectIdField.optional(),
  createdBy: objectIdField.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(['createdAt', 'dueDate', 'title', 'status', 'updatedAt', 'publishDate'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const assignmentSearchQuerySchema = assignmentListQuerySchema.pick({
  q: true,
  page: true,
  limit: true,
  sortBy: true,
  sortOrder: true,
  courseId: true,
  status: true,
});

export const assignmentIdParamsSchema = z.object({
  id: objectIdField,
});

export const submissionIdParamsSchema = z.object({
  id: objectIdField,
});

export const rubricIdParamsSchema = z.object({
  id: objectIdField,
});

export const commentIdParamsSchema = z.object({
  id: objectIdField,
});

export const createAssignmentSchema = z.object({
  courseId: objectIdField,
  moduleId: objectIdField.optional().nullable(),
  lessonId: objectIdField.optional().nullable(),
  title: z.string().trim().min(1).max(200),
  description: optionalString(5000),
  instructions: optionalString(20000),
  assignmentType: assignmentTypeSchema.default('homework'),
  visibility: assignmentVisibilitySchema.default('enrolled'),
  totalMarks: z.number().min(0).max(10000).default(100),
  passingMarks: z.number().min(0).max(10000).default(40),
  weightage: z.number().min(0).max(100).default(0),
  allowLateSubmission: z.boolean().default(true),
  latePenaltyPercent: z.number().min(0).max(100).default(0),
  allowResubmission: z.boolean().default(false),
  maxAttempts: z.number().int().min(1).max(20).default(1),
  publishDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  closeDate: z.string().datetime().optional().nullable(),
  estimatedMinutes: z.number().int().min(1).max(10080).optional().nullable(),
  rubricId: objectIdField.optional().nullable(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial().omit({ courseId: true });

export const createRubricCriterionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: optionalString(2000),
  weight: z.number().min(0).max(100).default(0),
  maxPoints: z.number().min(0).max(1000),
});

export const createRubricSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: optionalString(2000),
  criteria: z.array(createRubricCriterionSchema).min(1).max(50),
  reusable: z.boolean().default(true),
});

export const updateRubricSchema = createRubricSchema.partial();

export const saveSubmissionDraftSchema = z.object({
  assignmentId: objectIdField,
  submissionType: assignmentSubmissionTypeSchema.default('mixed'),
  textSubmission: optionalString(100000),
  links: z.array(z.string().url().max(2000)).max(20).optional().default([]),
  timeSpentMinutes: z.number().int().min(0).max(100000).optional().nullable(),
});

export const submitAssignmentSchema = saveSubmissionDraftSchema.extend({
  attemptNumber: z.number().int().min(1).max(20).optional(),
});

export const gradeSubmissionSchema = z.object({
  gradingMethod: assignmentGradingMethodSchema.default('marks'),
  marksObtained: z.number().min(0).max(10000).optional().nullable(),
  percentage: z.number().min(0).max(100).optional().nullable(),
  passed: z.boolean().optional().nullable(),
  feedback: optionalString(10000),
  rubricScores: z
    .array(
      z.object({
        criterionId: z.string().min(1).max(64),
        points: z.number().min(0).max(1000),
        comment: optionalString(2000),
      }),
    )
    .max(50)
    .optional()
    .default([]),
  returnToStudent: z.boolean().optional().default(false),
});

export const createCommentSchema = z.object({
  assignmentId: objectIdField,
  submissionId: objectIdField.optional().nullable(),
  parentCommentId: objectIdField.optional().nullable(),
  body: z.string().trim().min(1).max(10000),
});

export const assignmentImportConfirmSchema = z.object({
  rows: z
    .array(
      z.object({
        courseId: objectIdField,
        moduleId: objectIdField.optional().nullable(),
        lessonId: objectIdField.optional().nullable(),
        title: z.string().trim().min(1).max(200),
        assignmentType: assignmentTypeSchema.optional(),
        totalMarks: z.coerce.number().min(0).max(10000).optional(),
        passingMarks: z.coerce.number().min(0).max(10000).optional(),
        dueDate: z.string().optional().nullable(),
        description: optionalString(5000),
      }),
    )
    .min(1)
    .max(500),
  publish: z.boolean().optional().default(false),
});

export const assignmentExportQuerySchema = z.object({
  courseId: objectIdField.optional(),
  status: assignmentStatusSchema.optional(),
  format: z.enum(['json', 'csv']).optional().default('json'),
});

export const submissionListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  assignmentId: objectIdField.optional(),
  courseId: objectIdField.optional(),
  studentId: objectIdField.optional(),
  status: assignmentSubmissionStatusSchema.optional(),
  late: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  graded: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(['createdAt', 'submittedAt', 'status', 'attemptNumber', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type CreateRubricInput = z.infer<typeof createRubricSchema>;
export type UpdateRubricInput = z.infer<typeof updateRubricSchema>;
export type SaveSubmissionDraftInput = z.infer<typeof saveSubmissionDraftSchema>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type AssignmentListQuery = z.infer<typeof assignmentListQuerySchema>;
export type SubmissionListQuery = z.infer<typeof submissionListQuerySchema>;
export type AssignmentFileUploadInput = z.infer<typeof assignmentFileUploadSchema>;
