import { z } from 'zod';
import { REGEX } from '@learnova/constants';
import {
  assessmentLifecycleStatusSchema,
  assessmentVisibilitySchema,
} from './assessment.js';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');
const optionalString = (max: number) => z.string().trim().max(max).optional().nullable();

export const practiceLanguageSchema = z.enum([
  'c',
  'cpp',
  'java',
  'python',
  'javascript',
  'typescript',
  'go',
  'rust',
  'csharp',
  'kotlin',
]);

export const practiceDifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const practiceLabStatusSchema = assessmentLifecycleStatusSchema;
export const practiceLabVisibilitySchema = assessmentVisibilitySchema;

export const testCaseVisibilitySchema = z.enum(['public', 'hidden']);

export const executionStatusSchema = z.enum([
  'queued',
  'running',
  'accepted',
  'wrong_answer',
  'compilation_error',
  'runtime_error',
  'time_limit_exceeded',
  'memory_limit_exceeded',
  'internal_error',
  'cancelled',
]);

export const submissionVerdictSchema = z.enum([
  'pending',
  'accepted',
  'wrong_answer',
  'compilation_error',
  'runtime_error',
  'time_limit_exceeded',
  'memory_limit_exceeded',
  'partial',
  'failed',
]);

export const languageBoilerplateSchema = z.object({
  language: practiceLanguageSchema,
  code: z.string().max(200_000),
});

export const practiceLabListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  courseId: objectIdField.optional(),
  moduleId: objectIdField.optional(),
  lessonId: objectIdField.optional(),
  status: practiceLabStatusSchema.optional(),
  difficulty: practiceDifficultySchema.optional(),
  language: practiceLanguageSchema.optional(),
  solved: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  createdBy: objectIdField.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(['createdAt', 'title', 'status', 'difficulty', 'updatedAt', 'estimatedMinutes'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const practiceLabSearchQuerySchema = practiceLabListQuerySchema.pick({
  q: true,
  page: true,
  limit: true,
  sortBy: true,
  sortOrder: true,
  courseId: true,
  status: true,
  difficulty: true,
  language: true,
});

export const practiceLabIdParamsSchema = z.object({
  id: objectIdField,
});

export const problemIdParamsSchema = z.object({
  id: objectIdField,
});

export const testCaseIdParamsSchema = z.object({
  id: objectIdField,
});

export const submissionIdParamsSchema = z.object({
  id: objectIdField,
});

export const createPracticeLabSchema = z.object({
  courseId: objectIdField,
  moduleId: objectIdField.optional().nullable(),
  lessonId: objectIdField.optional().nullable(),
  title: z.string().trim().min(1).max(200),
  description: optionalString(5000),
  visibility: practiceLabVisibilitySchema.default('enrolled'),
  difficulty: practiceDifficultySchema.default('medium'),
  estimatedMinutes: z.number().int().min(1).max(10080).optional().nullable(),
  languages: z.array(practiceLanguageSchema).min(1).max(20).default(['python', 'javascript']),
  allowRun: z.boolean().default(true),
  allowSubmit: z.boolean().default(true),
  maxSubmissions: z.number().int().min(1).max(500).default(50),
});

export const updatePracticeLabSchema = createPracticeLabSchema.partial().omit({ courseId: true });

export const createLabProblemSchema = z.object({
  practiceLabId: objectIdField,
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug')
    .optional(),
  description: optionalString(5000),
  problemStatement: z.string().trim().min(1).max(50_000),
  inputFormat: optionalString(5000),
  outputFormat: optionalString(5000),
  constraints: optionalString(5000),
  sampleInput: optionalString(10_000),
  sampleOutput: optionalString(10_000),
  explanation: optionalString(20_000),
  difficulty: practiceDifficultySchema.default('medium'),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  memoryLimitMB: z.number().int().min(16).max(2048).default(256),
  timeLimitMS: z.number().int().min(100).max(30_000).default(2000),
  allowedLanguages: z.array(practiceLanguageSchema).min(1).max(20).optional(),
  boilerplates: z.array(languageBoilerplateSchema).max(20).default([]),
  solutionCode: optionalString(200_000),
  editorial: optionalString(50_000),
  order: z.number().int().min(0).max(10_000).optional(),
});

export const updateLabProblemSchema = createLabProblemSchema
  .partial()
  .omit({ practiceLabId: true });

export const createTestCaseSchema = z.object({
  problemId: objectIdField,
  input: z.string().max(100_000),
  expectedOutput: z.string().max(100_000),
  visibility: testCaseVisibilitySchema.default('hidden'),
  weight: z.number().min(0).max(1000).default(1),
  timeoutMS: z.number().int().min(100).max(30_000).optional().nullable(),
  memoryLimitMB: z.number().int().min(16).max(2048).optional().nullable(),
  order: z.number().int().min(0).max(10_000).optional(),
});

export const updateTestCaseSchema = createTestCaseSchema.partial().omit({ problemId: true });

export const bulkCreateTestCasesSchema = z.object({
  problemId: objectIdField,
  testCases: z.array(createTestCaseSchema.omit({ problemId: true })).min(1).max(200),
});

export const runCodeSchema = z.object({
  problemId: objectIdField.optional(),
  practiceLabId: objectIdField.optional(),
  language: practiceLanguageSchema,
  sourceCode: z.string().min(1).max(200_000),
  stdin: optionalString(100_000),
});

export const submitSolutionSchema = z.object({
  problemId: objectIdField,
  language: practiceLanguageSchema,
  sourceCode: z.string().min(1).max(200_000),
});

export const problemListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  practiceLabId: objectIdField.optional(),
  difficulty: practiceDifficultySchema.optional(),
  tag: z.string().trim().max(40).optional(),
  language: practiceLanguageSchema.optional(),
  solved: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(['createdAt', 'title', 'difficulty', 'order', 'updatedAt'])
    .optional()
    .default('order'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const submissionListQuerySchema = z.object({
  practiceLabId: objectIdField.optional(),
  problemId: objectIdField.optional(),
  studentId: objectIdField.optional(),
  language: practiceLanguageSchema.optional(),
  verdict: submissionVerdictSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'score', 'verdict']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const executionHistoryQuerySchema = z.object({
  practiceLabId: objectIdField.optional(),
  problemId: objectIdField.optional(),
  studentId: objectIdField.optional(),
  language: practiceLanguageSchema.optional(),
  isSubmission: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const leaderboardQuerySchema = z.object({
  scope: z.enum(['global', 'course', 'department', 'faculty', 'lab', 'problem']).default('lab'),
  courseId: objectIdField.optional(),
  departmentId: objectIdField.optional(),
  facultyId: objectIdField.optional(),
  practiceLabId: objectIdField.optional(),
  problemId: objectIdField.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const importProblemsSchema = z.object({
  practiceLabId: objectIdField,
  problems: z
    .array(
      createLabProblemSchema.omit({ practiceLabId: true }).extend({
        testCases: z
          .array(createTestCaseSchema.omit({ problemId: true }))
          .max(100)
          .optional(),
      }),
    )
    .min(1)
    .max(100),
});

export const duplicateLabSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  courseId: objectIdField.optional(),
});

export const practiceLabExportQuerySchema = z.object({
  courseId: objectIdField.optional(),
  status: practiceLabStatusSchema.optional(),
  format: z.enum(['json', 'csv']).optional().default('json'),
});

export type CreatePracticeLabInput = z.infer<typeof createPracticeLabSchema>;
export type UpdatePracticeLabInput = z.infer<typeof updatePracticeLabSchema>;
export type CreateLabProblemInput = z.infer<typeof createLabProblemSchema>;
export type UpdateLabProblemInput = z.infer<typeof updateLabProblemSchema>;
export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;
export type UpdateTestCaseInput = z.infer<typeof updateTestCaseSchema>;
export type RunCodeInput = z.infer<typeof runCodeSchema>;
export type SubmitSolutionInput = z.infer<typeof submitSolutionSchema>;
export type PracticeLabListQuery = z.infer<typeof practiceLabListQuerySchema>;
export type ProblemListQuery = z.infer<typeof problemListQuerySchema>;
export type SubmissionListQuery = z.infer<typeof submissionListQuerySchema>;
export type ExecutionHistoryQuery = z.infer<typeof executionHistoryQuerySchema>;
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
export type ImportProblemsInput = z.infer<typeof importProblemsSchema>;
export type DuplicateLabInput = z.infer<typeof duplicateLabSchema>;
