import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '@learnova/constants';
import {
  attemptIdParamsSchema,
  createQuestionBankSchema,
  createQuestionCategorySchema,
  createQuestionSchema,
  createQuestionTagSchema,
  createQuizSchema,
  quizBulkActionSchema,
  quizExportQuerySchema,
  quizIdParamsSchema,
  quizImportConfirmSchema,
  quizListQuerySchema,
  quizSearchQuerySchema,
  questionBankIdParamsSchema,
  questionIdParamsSchema,
  questionListQuerySchema,
  startAttemptSchema,
  submitAnswerSchema,
  submitQuizSchema,
  updateQuestionBankSchema,
  updateQuestionSchema,
  updateQuizSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/quiz/quiz.controller.js';

const quizRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.QUIZ_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.QUIZ_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.QUIZ_MANAGE),
] as RequestHandler[];

const quizImportPreviewSchema = z.object({
  quizzes: z.array(createQuizSchema).min(1).max(100),
});

const categoryIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId'),
});

// ------------------------------------------------------------------ collection

quizRoutes.get(
  '/quizzes',
  ...readAuth,
  validate(quizListQuerySchema, 'query'),
  ctrl.listQuizzes,
);

quizRoutes.get(
  '/quizzes/search',
  ...readAuth,
  validate(quizSearchQuerySchema, 'query'),
  ctrl.searchQuizzes,
);

quizRoutes.get('/quizzes/stats', ...manageAuth, ctrl.getQuizStats);

quizRoutes.get('/quizzes/audit', ...manageAuth, ctrl.listQuizAudit);

quizRoutes.get('/quizzes/dashboard/faculty', ...readAuth, ctrl.facultyDashboard);

quizRoutes.get('/quizzes/dashboard/student', ...readAuth, ctrl.studentDashboard);

quizRoutes.get('/quizzes/dashboard/institution', ...manageAuth, ctrl.institutionDashboard);

quizRoutes.get(
  '/quizzes/export',
  ...readAuth,
  validate(quizExportQuerySchema, 'query'),
  ctrl.exportQuizzes,
);

quizRoutes.post(
  '/quizzes/import/preview',
  ...manageAuth,
  validate(quizImportPreviewSchema),
  ctrl.previewImportQuizzes,
);

quizRoutes.post(
  '/quizzes/import',
  ...manageAuth,
  validate(quizImportConfirmSchema),
  ctrl.confirmImportQuizzes,
);

quizRoutes.post(
  '/quizzes/bulk',
  ...writeAuth,
  validate(quizBulkActionSchema),
  ctrl.bulkQuizAction,
);

// ------------------------------------------------------------------ question banks

quizRoutes.get('/question-banks', ...readAuth, ctrl.listQuestionBanks);

quizRoutes.post(
  '/question-banks',
  ...writeAuth,
  validate(createQuestionBankSchema),
  ctrl.createQuestionBank,
);

quizRoutes.get(
  '/question-banks/:id',
  ...readAuth,
  validate(questionBankIdParamsSchema, 'params'),
  ctrl.getQuestionBank,
);

quizRoutes.patch(
  '/question-banks/:id',
  ...writeAuth,
  validate(questionBankIdParamsSchema, 'params'),
  validate(updateQuestionBankSchema),
  ctrl.updateQuestionBank,
);

quizRoutes.post(
  '/question-banks/:id/archive',
  ...writeAuth,
  validate(questionBankIdParamsSchema, 'params'),
  ctrl.archiveQuestionBank,
);

quizRoutes.post(
  '/question-banks/:id/duplicate',
  ...writeAuth,
  validate(questionBankIdParamsSchema, 'params'),
  ctrl.duplicateQuestionBank,
);

// ------------------------------------------------------------------ questions

quizRoutes.get(
  '/questions',
  ...readAuth,
  validate(questionListQuerySchema, 'query'),
  ctrl.listQuestions,
);

quizRoutes.post(
  '/questions',
  ...writeAuth,
  validate(createQuestionSchema),
  ctrl.createQuestion,
);

quizRoutes.get(
  '/questions/:id',
  ...readAuth,
  validate(questionIdParamsSchema, 'params'),
  ctrl.getQuestion,
);

quizRoutes.patch(
  '/questions/:id',
  ...writeAuth,
  validate(questionIdParamsSchema, 'params'),
  validate(updateQuestionSchema),
  ctrl.updateQuestion,
);

quizRoutes.delete(
  '/questions/:id',
  ...writeAuth,
  validate(questionIdParamsSchema, 'params'),
  ctrl.deleteQuestion,
);

quizRoutes.post(
  '/questions/:id/duplicate',
  ...writeAuth,
  validate(questionIdParamsSchema, 'params'),
  ctrl.duplicateQuestion,
);

// ------------------------------------------------------------------ categories / tags

quizRoutes.get('/question-categories', ...readAuth, ctrl.listCategories);

quizRoutes.post(
  '/question-categories',
  ...writeAuth,
  validate(createQuestionCategorySchema),
  ctrl.createCategory,
);

quizRoutes.patch(
  '/question-categories/:id',
  ...writeAuth,
  validate(categoryIdParamsSchema, 'params'),
  validate(createQuestionCategorySchema.partial()),
  ctrl.updateCategory,
);

quizRoutes.delete(
  '/question-categories/:id',
  ...writeAuth,
  validate(categoryIdParamsSchema, 'params'),
  ctrl.deleteCategory,
);

quizRoutes.get('/question-tags', ...readAuth, ctrl.listTags);

quizRoutes.post(
  '/question-tags',
  ...writeAuth,
  validate(createQuestionTagSchema),
  ctrl.createTag,
);

quizRoutes.patch(
  '/question-tags/:id',
  ...writeAuth,
  validate(categoryIdParamsSchema, 'params'),
  validate(createQuestionTagSchema.partial()),
  ctrl.updateTag,
);

quizRoutes.delete(
  '/question-tags/:id',
  ...writeAuth,
  validate(categoryIdParamsSchema, 'params'),
  ctrl.deleteTag,
);

// ------------------------------------------------------------------ attempts

quizRoutes.get('/attempts', ...readAuth, ctrl.listAttempts);

quizRoutes.post(
  '/attempts/start',
  ...writeAuth,
  validate(startAttemptSchema),
  ctrl.startAttempt,
);

quizRoutes.post(
  '/attempts/submit',
  ...writeAuth,
  validate(submitQuizSchema),
  ctrl.submitQuiz,
);

quizRoutes.get(
  '/attempts/:id',
  ...readAuth,
  validate(attemptIdParamsSchema, 'params'),
  ctrl.getAttempt,
);

quizRoutes.post(
  '/attempts/:id/answers',
  ...writeAuth,
  validate(attemptIdParamsSchema, 'params'),
  validate(submitAnswerSchema),
  ctrl.saveAnswer,
);

// ------------------------------------------------------------------ analytics

quizRoutes.get(
  '/analytics/quizzes/:id',
  ...readAuth,
  validate(quizIdParamsSchema, 'params'),
  ctrl.getQuizAnalytics,
);

// ------------------------------------------------------------------ item

quizRoutes.post(
  '/quizzes',
  ...writeAuth,
  validate(createQuizSchema),
  ctrl.createQuiz,
);

quizRoutes.get(
  '/quizzes/:id',
  ...readAuth,
  validate(quizIdParamsSchema, 'params'),
  ctrl.getQuiz,
);

quizRoutes.patch(
  '/quizzes/:id',
  ...writeAuth,
  validate(quizIdParamsSchema, 'params'),
  validate(updateQuizSchema),
  ctrl.updateQuiz,
);

quizRoutes.delete(
  '/quizzes/:id',
  ...writeAuth,
  validate(quizIdParamsSchema, 'params'),
  ctrl.deleteQuiz,
);

quizRoutes.post(
  '/quizzes/:id/publish',
  ...writeAuth,
  validate(quizIdParamsSchema, 'params'),
  ctrl.publishQuiz,
);

quizRoutes.post(
  '/quizzes/:id/archive',
  ...writeAuth,
  validate(quizIdParamsSchema, 'params'),
  ctrl.archiveQuiz,
);

quizRoutes.post(
  '/quizzes/:id/close',
  ...writeAuth,
  validate(quizIdParamsSchema, 'params'),
  ctrl.closeQuiz,
);

quizRoutes.post(
  '/quizzes/:id/duplicate',
  ...writeAuth,
  validate(quizIdParamsSchema, 'params'),
  ctrl.duplicateQuiz,
);

quizRoutes.get(
  '/quizzes/:id/analytics',
  ...readAuth,
  validate(quizIdParamsSchema, 'params'),
  ctrl.getQuizAnalytics,
);

export default quizRoutes;
