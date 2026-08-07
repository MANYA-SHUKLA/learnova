import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  assignProjectGradeSchema,
  finalizeCourseGradesSchema,
  gradebookCourseIdParamsSchema,
  gradebookListQuerySchema,
  ingestGradebookSourceSchema,
  syncCourseGradebookSchema,
  upsertWeightSchemeSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/gradebook/gradebook.controller.js';

const gradebookRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.GRADEBOOK_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.GRADEBOOK_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.GRADEBOOK_MANAGE),
] as RequestHandler[];

gradebookRoutes.get(
  '/gradebook/entries',
  ...readAuth,
  validate(gradebookListQuerySchema, 'query'),
  ctrl.listEntries,
);

gradebookRoutes.get(
  '/gradebook/courses/:courseId/entries',
  ...readAuth,
  validate(gradebookCourseIdParamsSchema, 'params'),
  ctrl.getCourseEntries,
);

gradebookRoutes.get(
  '/gradebook/courses/:courseId/summaries',
  ...readAuth,
  validate(gradebookCourseIdParamsSchema, 'params'),
  ctrl.getCourseSummaries,
);

gradebookRoutes.get(
  '/gradebook/courses/:courseId/weight-scheme',
  ...readAuth,
  validate(gradebookCourseIdParamsSchema, 'params'),
  ctrl.getWeightScheme,
);

gradebookRoutes.put(
  '/gradebook/weight-scheme',
  ...writeAuth,
  validate(upsertWeightSchemeSchema),
  ctrl.upsertWeightScheme,
);

gradebookRoutes.post(
  '/gradebook/ingest',
  ...writeAuth,
  validate(ingestGradebookSourceSchema),
  ctrl.ingestSource,
);

gradebookRoutes.post(
  '/gradebook/sync',
  ...writeAuth,
  validate(syncCourseGradebookSchema),
  ctrl.syncCourse,
);

gradebookRoutes.post(
  '/gradebook/project/grade',
  ...writeAuth,
  validate(assignProjectGradeSchema),
  ctrl.assignProjectGrade,
);

gradebookRoutes.post(
  '/gradebook/finalize',
  ...manageAuth,
  validate(finalizeCourseGradesSchema),
  ctrl.finalizeCourse,
);

gradebookRoutes.get(
  '/gradebook/courses/:courseId/pending-projects',
  ...writeAuth,
  validate(gradebookCourseIdParamsSchema, 'params'),
  ctrl.listPendingProjects,
);

gradebookRoutes.get('/gradebook/dashboard/institution', ...manageAuth, ctrl.institutionDashboard);

gradebookRoutes.get('/gradebook/dashboard/faculty', ...readAuth, ctrl.facultyDashboard);

gradebookRoutes.get('/gradebook/dashboard/student', ...readAuth, ctrl.studentDashboard);

export default gradebookRoutes;
