import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  assignProjectGradeSchema,
  createGradeAppealSchema,
  createGradeCommentSchema,
  finalizeCourseGradesSchema,
  gradeReportQuerySchema,
  gradebookBulkActionSchema,
  gradebookCourseIdParamsSchema,
  gradebookListQuerySchema,
  ingestGradebookSourceSchema,
  lockCourseGradesSchema,
  publishCourseGradesSchema,
  resolveGradeAppealSchema,
  semesterGradeQuerySchema,
  syncCourseGradebookSchema,
  unlockCourseGradesSchema,
  upsertWeightSchemeSchema,
  upsertAcademicPolicySchema,
  moderationActionSchema,
  compareSnapshotsQuerySchema,
  listSnapshotsQuerySchema,
  computeStandingSchema,
} from '@learnova/validation';
import { z } from 'zod';
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

gradebookRoutes.post('/gradebook/publish', ...writeAuth, validate(publishCourseGradesSchema), ctrl.publishGrades);
gradebookRoutes.post('/gradebook/lock', ...writeAuth, validate(lockCourseGradesSchema), ctrl.lockGrades);
gradebookRoutes.post('/gradebook/unlock', ...manageAuth, validate(unlockCourseGradesSchema), ctrl.unlockGrades);
gradebookRoutes.post('/gradebook/bulk', ...writeAuth, validate(gradebookBulkActionSchema), ctrl.bulkAction);

gradebookRoutes.post('/gradebook/appeals', ...readAuth, validate(createGradeAppealSchema), ctrl.createAppeal);
gradebookRoutes.post('/gradebook/appeals/resolve', ...writeAuth, validate(resolveGradeAppealSchema), ctrl.resolveAppeal);
gradebookRoutes.get('/gradebook/appeals', ...readAuth, ctrl.listAppeals);

gradebookRoutes.post('/gradebook/comments', ...writeAuth, validate(createGradeCommentSchema), ctrl.addComment);
gradebookRoutes.get('/gradebook/comments', ...readAuth, ctrl.listComments);

gradebookRoutes.get(
  '/gradebook/history/:courseGradeId',
  ...readAuth,
  validate(z.object({ courseGradeId: gradebookCourseIdParamsSchema.shape.courseId }), 'params'),
  ctrl.listHistory,
);

gradebookRoutes.get(
  '/gradebook/courses/:courseId/matrix',
  ...readAuth,
  validate(gradebookCourseIdParamsSchema, 'params'),
  ctrl.getCourseMatrix,
);

gradebookRoutes.get(
  '/gradebook/semester',
  ...readAuth,
  validate(semesterGradeQuerySchema, 'query'),
  ctrl.getSemesterGrades,
);
gradebookRoutes.post(
  '/gradebook/semester/recompute',
  ...writeAuth,
  validate(semesterGradeQuerySchema),
  ctrl.recomputeSemesterGrades,
);

gradebookRoutes.get(
  '/gradebook/cgpa/:studentId',
  ...readAuth,
  validate(z.object({ studentId: gradebookCourseIdParamsSchema.shape.courseId }), 'params'),
  ctrl.getCgpa,
);

gradebookRoutes.get(
  '/gradebook/reports',
  ...readAuth,
  validate(gradeReportQuerySchema, 'query'),
  ctrl.generateReport,
);

gradebookRoutes.get('/gradebook/policy', ...readAuth, ctrl.getAcademicPolicy);
gradebookRoutes.put(
  '/gradebook/policy',
  ...manageAuth,
  validate(upsertAcademicPolicySchema),
  ctrl.upsertAcademicPolicy,
);

gradebookRoutes.post(
  '/gradebook/moderation/submit',
  ...writeAuth,
  validate(moderationActionSchema),
  ctrl.submitModeration,
);
gradebookRoutes.post(
  '/gradebook/moderation/approve',
  ...manageAuth,
  validate(moderationActionSchema),
  ctrl.approveModeration,
);
gradebookRoutes.post(
  '/gradebook/moderation/publish',
  ...manageAuth,
  validate(moderationActionSchema),
  ctrl.publishModeration,
);
gradebookRoutes.get(
  '/gradebook/moderation/:courseId/timeline',
  ...readAuth,
  validate(gradebookCourseIdParamsSchema, 'params'),
  ctrl.listModerationTimeline,
);

gradebookRoutes.get(
  '/gradebook/snapshots',
  ...readAuth,
  validate(listSnapshotsQuerySchema, 'query'),
  ctrl.listSnapshots,
);
gradebookRoutes.get(
  '/gradebook/snapshots/compare',
  ...readAuth,
  validate(compareSnapshotsQuerySchema, 'query'),
  ctrl.compareSnapshots,
);

gradebookRoutes.post(
  '/gradebook/standing/compute',
  ...writeAuth,
  validate(computeStandingSchema),
  ctrl.computeStanding,
);
gradebookRoutes.get('/gradebook/standing', ...readAuth, ctrl.listStanding);

export default gradebookRoutes;
