import { z } from 'zod';
import {
  ASSESSMENT_ALLOWED_CONTENT_TYPES,
  ASSESSMENT_ATTEMPT_STATUSES,
  ASSESSMENT_DELIVERY_TYPES,
  ASSESSMENT_GRADING_METHODS,
  ASSESSMENT_KINDS,
  ASSESSMENT_LIFECYCLE_STATUSES,
  ASSESSMENT_MAX_FILE_BYTES,
  ASSESSMENT_VISIBILITIES,
  REGEX,
} from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');
const optionalString = (max: number) => z.string().trim().max(max).optional().nullable();

export const assessmentKindSchema = z.enum(ASSESSMENT_KINDS);
export const assessmentLifecycleStatusSchema = z.enum(ASSESSMENT_LIFECYCLE_STATUSES);
export const assessmentVisibilitySchema = z.enum(ASSESSMENT_VISIBILITIES);
export const assessmentAttemptStatusSchema = z.enum(ASSESSMENT_ATTEMPT_STATUSES);
export const assessmentDeliveryTypeSchema = z.enum(ASSESSMENT_DELIVERY_TYPES);
export const assessmentGradingMethodSchema = z.enum(ASSESSMENT_GRADING_METHODS);

export { ASSESSMENT_MAX_FILE_BYTES };

export const assessmentFileUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(ASSESSMENT_ALLOWED_CONTENT_TYPES),
  data: z.string().min(1).max(70_000_000),
});

export const assessmentDeadlineFieldsSchema = z.object({
  publishDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  closeDate: z.string().datetime().optional().nullable(),
  allowLateSubmission: z.boolean().default(true),
  latePenaltyPercent: z.number().min(0).max(100).default(0),
});

export const assessmentAttemptFieldsSchema = z.object({
  allowResubmission: z.boolean().default(false),
  maxAttempts: z.number().int().min(1).max(100).default(1),
});

export const assessmentMarksFieldsSchema = z.object({
  totalMarks: z.number().min(0).max(10000).default(100),
  passingMarks: z.number().min(0).max(10000).default(40),
  weightage: z.number().min(0).max(100).default(0),
});

export const assessmentRubricScoreSchema = z.object({
  criterionId: z.string().min(1).max(64),
  points: z.number().min(0).max(1000),
  comment: optionalString(2000),
});

export const assessmentGradeInputSchema = z.object({
  gradingMethod: assessmentGradingMethodSchema.default('marks'),
  marksObtained: z.number().min(0).max(10000).optional().nullable(),
  percentage: z.number().min(0).max(100).optional().nullable(),
  passed: z.boolean().optional().nullable(),
  feedback: optionalString(10000),
  rubricScores: z.array(assessmentRubricScoreSchema).max(50).optional().default([]),
  returnToStudent: z.boolean().optional().default(false),
});

export const assessmentFeedbackInputSchema = z.object({
  body: z.string().trim().min(1).max(10000),
  parentId: objectIdField.optional().nullable(),
  submissionId: objectIdField.optional().nullable(),
});

export const assessmentLifecycleTransitionSchema = z.object({
  from: assessmentLifecycleStatusSchema,
  to: assessmentLifecycleStatusSchema,
});

export type AssessmentFileUploadInput = z.infer<typeof assessmentFileUploadSchema>;
export type AssessmentGradeInput = z.infer<typeof assessmentGradeInputSchema>;
export type AssessmentFeedbackInput = z.infer<typeof assessmentFeedbackInputSchema>;
export type AssessmentDeadlineFields = z.infer<typeof assessmentDeadlineFieldsSchema>;
export type AssessmentAttemptFields = z.infer<typeof assessmentAttemptFieldsSchema>;
export type AssessmentMarksFields = z.infer<typeof assessmentMarksFieldsSchema>;
