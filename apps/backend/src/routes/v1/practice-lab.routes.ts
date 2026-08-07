import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  createLabProblemSchema,
  createPracticeLabSchema,
  createTestCaseSchema,
  duplicateLabSchema,
  executionHistoryQuerySchema,
  importProblemsSchema,
  leaderboardQuerySchema,
  practiceLabExportQuerySchema,
  practiceLabIdParamsSchema,
  practiceLabListQuerySchema,
  practiceLabSearchQuerySchema,
  problemIdParamsSchema,
  problemListQuerySchema,
  runCodeSchema,
  practiceSubmissionIdParamsSchema,
  practiceSubmissionListQuerySchema,
  submitSolutionSchema,
  testCaseIdParamsSchema,
  updateLabProblemSchema,
  updatePracticeLabSchema,
  updateTestCaseSchema,
} from '@learnova/validation';
import { z } from 'zod';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/practice-lab/practice-lab.controller.js';

const practiceLabRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.LAB_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.LAB_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.LAB_MANAGE),
] as RequestHandler[];

const problemIdInParams = z.object({ problemId: z.string().regex(/^[a-f\d]{24}$/i) });
const labIdParams = z.object({ labId: z.string().regex(/^[a-f\d]{24}$/i) });

// collection
practiceLabRoutes.get(
  '/practice-labs',
  ...readAuth,
  validate(practiceLabListQuerySchema, 'query'),
  ctrl.listPracticeLabs,
);

practiceLabRoutes.get(
  '/practice-labs/search',
  ...readAuth,
  validate(practiceLabSearchQuerySchema, 'query'),
  ctrl.searchPracticeLabs,
);

practiceLabRoutes.get(
  '/practice-labs/export',
  ...readAuth,
  validate(practiceLabExportQuerySchema, 'query'),
  ctrl.exportPracticeLabs,
);

practiceLabRoutes.get('/practice-labs/languages', ...readAuth, ctrl.listLanguages);

practiceLabRoutes.get(
  '/practice-labs/dashboard/institution',
  ...manageAuth,
  ctrl.institutionDashboard,
);

practiceLabRoutes.get('/practice-labs/dashboard/faculty', ...readAuth, ctrl.facultyDashboard);

practiceLabRoutes.get('/practice-labs/dashboard/student', ...readAuth, ctrl.studentDashboard);

practiceLabRoutes.get('/practice-labs/audit', ...manageAuth, ctrl.listAudit);

practiceLabRoutes.get(
  '/practice-labs/leaderboard',
  ...readAuth,
  validate(leaderboardQuerySchema, 'query'),
  ctrl.getLeaderboard,
);

practiceLabRoutes.get(
  '/practice-labs/problems',
  ...readAuth,
  validate(problemListQuerySchema, 'query'),
  ctrl.listProblems,
);

practiceLabRoutes.post(
  '/practice-labs/problems',
  ...writeAuth,
  validate(createLabProblemSchema),
  ctrl.createProblem,
);

practiceLabRoutes.post(
  '/practice-labs/problems/import',
  ...writeAuth,
  validate(importProblemsSchema),
  ctrl.importProblems,
);

practiceLabRoutes.get(
  '/practice-labs/problems/:id',
  ...readAuth,
  validate(problemIdParamsSchema, 'params'),
  ctrl.getProblem,
);

practiceLabRoutes.patch(
  '/practice-labs/problems/:id',
  ...writeAuth,
  validate(problemIdParamsSchema, 'params'),
  validate(updateLabProblemSchema),
  ctrl.updateProblem,
);

practiceLabRoutes.delete(
  '/practice-labs/problems/:id',
  ...writeAuth,
  validate(problemIdParamsSchema, 'params'),
  ctrl.deleteProblem,
);

practiceLabRoutes.get(
  '/practice-labs/problems/:problemId/test-cases',
  ...readAuth,
  validate(problemIdInParams, 'params'),
  ctrl.listTestCases,
);

practiceLabRoutes.post(
  '/practice-labs/test-cases',
  ...writeAuth,
  validate(createTestCaseSchema),
  ctrl.createTestCase,
);

practiceLabRoutes.patch(
  '/practice-labs/test-cases/:id',
  ...writeAuth,
  validate(testCaseIdParamsSchema, 'params'),
  validate(updateTestCaseSchema),
  ctrl.updateTestCase,
);

practiceLabRoutes.delete(
  '/practice-labs/test-cases/:id',
  ...writeAuth,
  validate(testCaseIdParamsSchema, 'params'),
  ctrl.deleteTestCase,
);

practiceLabRoutes.post(
  '/practice-labs/run',
  ...writeAuth,
  validate(runCodeSchema),
  ctrl.runCode,
);

practiceLabRoutes.post(
  '/practice-labs/submit',
  ...writeAuth,
  validate(submitSolutionSchema),
  ctrl.submitSolution,
);

practiceLabRoutes.get(
  '/practice-labs/submissions',
  ...readAuth,
  validate(practiceSubmissionListQuerySchema, 'query'),
  ctrl.listSubmissions,
);

practiceLabRoutes.get(
  '/practice-labs/submissions/:id',
  ...readAuth,
  validate(practiceSubmissionIdParamsSchema, 'params'),
  ctrl.getSubmission,
);

practiceLabRoutes.get(
  '/practice-labs/executions',
  ...readAuth,
  validate(executionHistoryQuerySchema, 'query'),
  ctrl.listExecutions,
);

practiceLabRoutes.get(
  '/practice-labs/:labId/progress',
  ...readAuth,
  validate(labIdParams, 'params'),
  ctrl.getProgress,
);

practiceLabRoutes.post(
  '/practice-labs',
  ...writeAuth,
  validate(createPracticeLabSchema),
  ctrl.createPracticeLab,
);

practiceLabRoutes.get(
  '/practice-labs/:id',
  ...readAuth,
  validate(practiceLabIdParamsSchema, 'params'),
  ctrl.getPracticeLab,
);

practiceLabRoutes.patch(
  '/practice-labs/:id',
  ...writeAuth,
  validate(practiceLabIdParamsSchema, 'params'),
  validate(updatePracticeLabSchema),
  ctrl.updatePracticeLab,
);

practiceLabRoutes.delete(
  '/practice-labs/:id',
  ...writeAuth,
  validate(practiceLabIdParamsSchema, 'params'),
  ctrl.deletePracticeLab,
);

practiceLabRoutes.post(
  '/practice-labs/:id/publish',
  ...writeAuth,
  validate(practiceLabIdParamsSchema, 'params'),
  ctrl.publishPracticeLab,
);

practiceLabRoutes.post(
  '/practice-labs/:id/archive',
  ...writeAuth,
  validate(practiceLabIdParamsSchema, 'params'),
  ctrl.archivePracticeLab,
);

practiceLabRoutes.post(
  '/practice-labs/:id/restore',
  ...writeAuth,
  validate(practiceLabIdParamsSchema, 'params'),
  ctrl.restorePracticeLab,
);

practiceLabRoutes.post(
  '/practice-labs/:id/close',
  ...writeAuth,
  validate(practiceLabIdParamsSchema, 'params'),
  ctrl.closePracticeLab,
);

practiceLabRoutes.post(
  '/practice-labs/:id/duplicate',
  ...writeAuth,
  validate(practiceLabIdParamsSchema, 'params'),
  validate(duplicateLabSchema),
  ctrl.duplicatePracticeLab,
);

export default practiceLabRoutes;
