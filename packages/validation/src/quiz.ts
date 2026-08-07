import { z } from 'zod';
import { REGEX } from '@learnova/constants';
import {
  assessmentLifecycleStatusSchema,
  assessmentVisibilitySchema,
} from './assessment.js';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');
const optionalString = (max: number) => z.string().trim().max(max).optional().nullable();

export const quizTypeSchema = z.enum([
  'practice',
  'lesson',
  'module',
  'course',
  'revision',
]);

export const quizStatusSchema = assessmentLifecycleStatusSchema;
export const quizVisibilitySchema = assessmentVisibilitySchema;

export const quizDifficultySchema = z.enum(['easy', 'medium', 'hard', 'mixed']);

export const questionTypeSchema = z.enum([
  'single_choice',
  'multiple_choice',
  'true_false',
  'assertion_reason',
  'match_following',
  'fill_blank',
]);

export const questionDifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const quizAttemptStatusSchema = z.enum([
  'started',
  'submitted',
  'completed',
  'expired',
  'abandoned',
]);

export const questionBankStatusSchema = z.enum(['active', 'archived']);

export const questionOptionSchema = z.object({
  id: objectIdField.optional(),
  optionText: z.string().trim().min(1).max(2000),
  isCorrect: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0),
  feedback: optionalString(1000),
});

export const matchPairSchema = z.object({
  id: objectIdField.optional(),
  left: z.string().trim().min(1).max(500),
  right: z.string().trim().min(1).max(500),
  displayOrder: z.number().int().min(0).default(0),
});

export const createQuestionSchema = z.object({
  questionBankId: objectIdField,
  question: z.string().trim().min(1).max(10000),
  description: optionalString(5000),
  questionType: questionTypeSchema,
  difficulty: questionDifficultySchema.default('medium'),
  marks: z.number().min(0).max(1000).default(1),
  negativeMarks: z.number().min(0).max(100).default(0),
  explanation: z
    .object({
      text: optionalString(5000),
      mediaUrl: optionalString(2000),
    })
    .optional()
    .nullable(),
  hint: optionalString(2000),
  tags: z.array(z.string().trim().max(50)).max(20).optional().default([]),
  category: optionalString(100),
  options: z.array(questionOptionSchema).max(20).optional().default([]),
  matchPairs: z.array(matchPairSchema).max(20).optional().default([]),
  fillBlankAnswers: z.array(z.string().trim().max(500)).max(10).optional().default([]),
});

export const updateQuestionSchema = createQuestionSchema.partial().omit({ questionBankId: true });

export const createQuestionBankSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: optionalString(2000),
  categoryIds: z.array(objectIdField).max(20).optional().default([]),
  tagIds: z.array(objectIdField).max(50).optional().default([]),
});

export const updateQuestionBankSchema = createQuestionBankSchema.partial();

export const createQuestionCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: optionalString(500),
});

export const createQuestionTagSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export const quizSectionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: optionalString(1000),
  marks: z.number().min(0).max(10000).default(0),
  questionCount: z.number().int().min(0).max(500).default(0),
  randomizeQuestions: z.boolean().default(false),
  randomQuestionCount: z.number().int().min(1).max(500).optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  questionIds: z.array(objectIdField).max(500).optional().default([]),
});

export const createQuizSchema = z.object({
  courseId: objectIdField,
  moduleId: objectIdField.optional().nullable(),
  lessonId: objectIdField.optional().nullable(),
  title: z.string().trim().min(1).max(200),
  description: optionalString(5000),
  instructions: optionalString(5000),
  visibility: quizVisibilitySchema.default('enrolled'),
  quizType: quizTypeSchema.default('practice'),
  difficulty: quizDifficultySchema.default('medium'),
  passingMarks: z.number().min(0).max(10000).default(40),
  totalMarks: z.number().min(0).max(10000).default(100),
  durationMinutes: z.number().int().min(1).max(600).optional().nullable(),
  attemptLimit: z.number().int().min(1).max(20).default(3),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  showResultsImmediately: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(false),
  allowReview: z.boolean().default(true),
  negativeMarking: z.boolean().default(false),
  negativeMarkValue: z.number().min(0).max(10).default(0.25),
  publishDate: z.coerce.date().optional().nullable(),
  closeDate: z.coerce.date().optional().nullable(),
  sections: z.array(quizSectionSchema).max(20).optional().default([]),
  questionIds: z.array(objectIdField).max(500).optional().default([]),
});

export const updateQuizSchema = createQuizSchema.partial().omit({ courseId: true });

export const quizListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  courseId: objectIdField.optional(),
  moduleId: objectIdField.optional(),
  lessonId: objectIdField.optional(),
  status: quizStatusSchema.optional(),
  quizType: quizTypeSchema.optional(),
  difficulty: quizDifficultySchema.optional(),
  published: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  createdBy: objectIdField.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'difficulty', 'durationMinutes', 'publishDate'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const quizSearchQuerySchema = quizListQuerySchema.pick({
  q: true,
  page: true,
  limit: true,
  sortBy: true,
  sortOrder: true,
  courseId: true,
  status: true,
});

export const questionListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  questionBankId: objectIdField.optional(),
  questionType: questionTypeSchema.optional(),
  difficulty: questionDifficultySchema.optional(),
  category: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'marks', 'difficulty']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const quizIdParamsSchema = z.object({ id: objectIdField });
export const questionIdParamsSchema = z.object({ id: objectIdField });
export const questionBankIdParamsSchema = z.object({ id: objectIdField });
export const attemptIdParamsSchema = z.object({ id: objectIdField });

export const startAttemptSchema = z.object({ quizId: objectIdField });

export const submitAnswerSchema = z.object({
  questionId: objectIdField,
  selectedOptionIds: z.array(objectIdField).max(20).optional().default([]),
  textAnswer: optionalString(5000),
  matchAnswers: z.record(z.string(), z.string()).optional().default({}),
  timeSpentSeconds: z.number().int().min(0).max(86400).optional().default(0),
});

export const submitQuizSchema = z.object({
  attemptId: objectIdField,
  answers: z.array(submitAnswerSchema).max(500).optional().default([]),
});

export const quizBulkActionSchema = z.object({
  ids: z.array(objectIdField).min(1).max(100),
  action: z.enum(['publish', 'archive', 'duplicate', 'delete', 'assign_faculty']),
  facultyId: objectIdField.optional(),
});

export const quizImportConfirmSchema = z.object({
  importId: z.string().trim().min(1).max(100),
  confirm: z.literal(true),
});

export const quizExportQuerySchema = z.object({
  courseId: objectIdField.optional(),
  status: quizStatusSchema.optional(),
  format: z.enum(['json', 'csv']).optional().default('json'),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type QuizListQuery = z.infer<typeof quizListQuerySchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type CreateQuestionBankInput = z.infer<typeof createQuestionBankSchema>;
export type UpdateQuestionBankInput = z.infer<typeof updateQuestionBankSchema>;
export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type QuizBulkActionInput = z.infer<typeof quizBulkActionSchema>;
