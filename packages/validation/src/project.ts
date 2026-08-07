import { z } from 'zod';
import {
  ASSESSMENT_MAX_FILE_BYTES,
  PROJECT_MAX_MILESTONES,
  PROJECT_MAX_PEER_REVIEWS_REQUIRED,
  PROJECT_MAX_TEAM_SIZE,
  REGEX,
} from '@learnova/constants';
import {
  assessmentAttemptStatusSchema,
  assessmentDeliveryTypeSchema,
  assessmentFileUploadSchema,
  assessmentGradingMethodSchema,
  assessmentLifecycleStatusSchema,
  assessmentRubricScoreSchema,
  assessmentVisibilitySchema,
} from './assessment.js';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');
const optionalString = (max: number) => z.string().trim().max(max).optional().nullable();

export const projectTypeSchema = z.enum(['individual', 'team', 'hybrid']);

/** Project lifecycle/status = Assessment Core lifecycle */
export const projectStatusSchema = assessmentLifecycleStatusSchema;
export const projectVisibilitySchema = assessmentVisibilitySchema;
export const projectSubmissionStatusSchema = assessmentAttemptStatusSchema;
export const projectDeliveryTypeSchema = assessmentDeliveryTypeSchema.extract([
  'text',
  'file',
  'link',
  'mixed',
]);
export const projectGradingMethodSchema = assessmentGradingMethodSchema.extract([
  'manual',
  'rubric',
  'pass_fail',
  'marks',
  'percentage',
]);

export const projectTeamStatusSchema = z.enum(['forming', 'active', 'dissolved']);
export const projectTeamMemberRoleSchema = z.enum(['leader', 'member']);
export const projectMilestoneStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'overdue',
]);
export const projectReviewTypeSchema = z.enum(['peer', 'faculty']);
export const projectReviewStatusSchema = z.enum(['draft', 'submitted']);
export const projectProgressStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'submitted',
  'graded',
]);

/** @deprecated Prefer ASSESSMENT_MAX_FILE_BYTES — kept for project callers */
export const PROJECT_MAX_FILE_BYTES = ASSESSMENT_MAX_FILE_BYTES;

export const projectAllowedContentTypes = assessmentFileUploadSchema.shape.contentType.options;

export const projectFileUploadSchema = assessmentFileUploadSchema;

export const projectListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  courseId: objectIdField.optional(),
  moduleId: objectIdField.optional(),
  lessonId: objectIdField.optional(),
  status: projectStatusSchema.optional(),
  projectType: projectTypeSchema.optional(),
  published: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  due: z.enum(['upcoming', 'overdue', 'none']).optional(),
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

export const projectSearchQuerySchema = projectListQuerySchema.pick({
  q: true,
  page: true,
  limit: true,
  sortBy: true,
  sortOrder: true,
  courseId: true,
  status: true,
});

export const projectIdParamsSchema = z.object({
  id: objectIdField,
});

export const projectTeamIdParamsSchema = z.object({
  id: objectIdField,
});

export const projectMilestoneIdParamsSchema = z.object({
  id: objectIdField,
});

export const projectSubmissionIdParamsSchema = z.object({
  id: objectIdField,
});

export const projectReviewIdParamsSchema = z.object({
  id: objectIdField,
});

export const createProjectSchema = z.object({
  courseId: objectIdField,
  moduleId: objectIdField.optional().nullable(),
  lessonId: objectIdField.optional().nullable(),
  title: z.string().trim().min(1).max(200),
  description: optionalString(5000),
  instructions: optionalString(20000),
  projectType: projectTypeSchema.default('team'),
  teamSizeMin: z.number().int().min(1).max(PROJECT_MAX_TEAM_SIZE).default(1),
  teamSizeMax: z.number().int().min(1).max(PROJECT_MAX_TEAM_SIZE).default(6),
  allowSelfTeamFormation: z.boolean().default(true),
  allowPeerReview: z.boolean().default(false),
  peerReviewsRequired: z.number().int().min(0).max(PROJECT_MAX_PEER_REVIEWS_REQUIRED).default(0),
  allowRepoLink: z.boolean().default(true),
  allowMilestones: z.boolean().default(true),
  visibility: projectVisibilitySchema.default('enrolled'),
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

export const updateProjectSchema = createProjectSchema.partial().omit({ courseId: true });

export const createMilestoneSchema = z.object({
  projectId: objectIdField,
  title: z.string().trim().min(1).max(200),
  description: optionalString(5000),
  dueDate: z.string().datetime().optional().nullable(),
  order: z.number().int().min(0).max(PROJECT_MAX_MILESTONES).optional(),
  weight: z.number().min(0).max(100).default(0),
});

export const updateMilestoneSchema = createMilestoneSchema.partial().omit({ projectId: true });

export const createTeamSchema = z.object({
  projectId: objectIdField,
  name: z.string().trim().min(1).max(100),
  repoLink: z.string().url().max(2000).optional().nullable(),
});

export const updateTeamSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  repoLink: z.string().url().max(2000).optional().nullable(),
  status: projectTeamStatusSchema.optional(),
});

export const joinTeamSchema = z.object({
  teamId: objectIdField,
  role: projectTeamMemberRoleSchema.optional().default('member'),
});

export const saveProjectSubmissionDraftSchema = z.object({
  projectId: objectIdField,
  milestoneId: objectIdField.optional().nullable(),
  deliveryType: projectDeliveryTypeSchema.default('mixed'),
  textSubmission: optionalString(100000),
  links: z.array(z.string().url().max(2000)).max(20).optional().default([]),
  repoLink: z.string().url().max(2000).optional().nullable(),
  timeSpentMinutes: z.number().int().min(0).max(100000).optional().nullable(),
});

export const submitProjectSchema = saveProjectSubmissionDraftSchema.extend({
  attemptNumber: z.number().int().min(1).max(20).optional(),
});

export const gradeProjectSubmissionSchema = z.object({
  gradingMethod: projectGradingMethodSchema.default('marks'),
  marksObtained: z.number().min(0).max(10000).optional().nullable(),
  percentage: z.number().min(0).max(100).optional().nullable(),
  passed: z.boolean().optional().nullable(),
  feedback: optionalString(10000),
  rubricScores: z.array(assessmentRubricScoreSchema).max(50).optional().default([]),
  returnToStudent: z.boolean().optional().default(false),
});

export const createReviewSchema = z.object({
  projectId: objectIdField,
  submissionId: objectIdField,
  reviewType: projectReviewTypeSchema.default('peer'),
  rating: z.number().min(0).max(10).optional().nullable(),
  feedback: optionalString(10000),
  rubricScores: z.array(assessmentRubricScoreSchema).max(50).optional().default([]),
});

export const updateReviewSchema = createReviewSchema.partial().omit({
  projectId: true,
  submissionId: true,
});

export const submitReviewSchema = z.object({
  rating: z.number().min(0).max(10).optional().nullable(),
  feedback: optionalString(10000),
  rubricScores: z.array(assessmentRubricScoreSchema).max(50).optional().default([]),
});

export const projectImportConfirmSchema = z.object({
  rows: z
    .array(
      z.object({
        courseId: objectIdField,
        moduleId: objectIdField.optional().nullable(),
        lessonId: objectIdField.optional().nullable(),
        title: z.string().trim().min(1).max(200),
        projectType: projectTypeSchema.optional(),
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

export const projectExportQuerySchema = z.object({
  courseId: objectIdField.optional(),
  status: projectStatusSchema.optional(),
  format: z.enum(['json', 'csv']).optional().default('json'),
});

export const projectSubmissionListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  projectId: objectIdField.optional(),
  courseId: objectIdField.optional(),
  studentId: objectIdField.optional(),
  teamId: objectIdField.optional(),
  milestoneId: objectIdField.optional(),
  status: projectSubmissionStatusSchema.optional(),
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

export const teamListQuerySchema = z.object({
  projectId: objectIdField.optional(),
  courseId: objectIdField.optional(),
  status: projectTeamStatusSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'name', 'memberCount', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type JoinTeamInput = z.infer<typeof joinTeamSchema>;
export type SaveProjectSubmissionDraftInput = z.infer<typeof saveProjectSubmissionDraftSchema>;
export type SubmitProjectInput = z.infer<typeof submitProjectSchema>;
export type GradeProjectSubmissionInput = z.infer<typeof gradeProjectSubmissionSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;
export type ProjectSubmissionListQuery = z.infer<typeof projectSubmissionListQuerySchema>;
export type ProjectTeamListQuery = z.infer<typeof teamListQuerySchema>;
export type ProjectFileUploadInput = z.infer<typeof projectFileUploadSchema>;
