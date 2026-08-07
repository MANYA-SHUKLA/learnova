import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  assignSeatingSchema,
  attemptIdParamsSchema,
  checkInExamSchema,
  createExamSchema,
  examBulkActionSchema,
  examIdParamsSchema,
  examListQuerySchema,
  proctorEventSchema,
  reportStudentViolationSchema,
  startExamAttemptSchema,
  submitExamAnswerSchema,
  submitExamSchema,
  updateExamSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/examination/examination.controller.js';

const examinationRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.EXAMINATION_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.EXAMINATION_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.EXAMINATION_MANAGE),
] as RequestHandler[];

const proctorAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.EXAMINATION_PROCTOR),
] as RequestHandler[];

examinationRoutes.get('/examinations/policies', ...readAuth, ctrl.listPolicies);

examinationRoutes.post('/examinations/policies', ...writeAuth, ctrl.createPolicy);

// ------------------------------------------------------------------ collection

examinationRoutes.get(
  '/examinations',
  ...readAuth,
  validate(examListQuerySchema, 'query'),
  ctrl.listExams,
);

examinationRoutes.get('/examinations/dashboard/faculty', ...readAuth, ctrl.facultyDashboard);

examinationRoutes.get('/examinations/dashboard/student', ...readAuth, ctrl.studentDashboard);

examinationRoutes.get(
  '/examinations/dashboard/institution',
  ...manageAuth,
  ctrl.institutionDashboard,
);

examinationRoutes.get('/examinations/audit', ...manageAuth, ctrl.listExamAudit);

examinationRoutes.post(
  '/examinations/bulk',
  ...writeAuth,
  validate(examBulkActionSchema),
  ctrl.bulkExamAction,
);

// ------------------------------------------------------------------ seating / check-in

examinationRoutes.post(
  '/examinations/seating/assign',
  ...writeAuth,
  validate(assignSeatingSchema),
  ctrl.assignSeating,
);

examinationRoutes.post(
  '/examinations/check-in',
  ...writeAuth,
  validate(checkInExamSchema),
  ctrl.checkInExam,
);

// ------------------------------------------------------------------ attempts

examinationRoutes.get('/examinations/attempts', ...readAuth, ctrl.listAttempts);

examinationRoutes.post(
  '/examinations/attempts/start',
  ...writeAuth,
  validate(startExamAttemptSchema),
  ctrl.startAttempt,
);

examinationRoutes.post(
  '/examinations/attempts/submit',
  ...writeAuth,
  validate(submitExamSchema),
  ctrl.submitExam,
);

examinationRoutes.get(
  '/examinations/attempts/:id',
  ...readAuth,
  validate(attemptIdParamsSchema, 'params'),
  ctrl.getAttempt,
);

examinationRoutes.post(
  '/examinations/attempts/:id/violations',
  ...writeAuth,
  validate(attemptIdParamsSchema, 'params'),
  validate(reportStudentViolationSchema),
  ctrl.reportStudentViolation,
);

examinationRoutes.post(
  '/examinations/attempts/:id/answers',
  ...writeAuth,
  validate(attemptIdParamsSchema, 'params'),
  validate(submitExamAnswerSchema),
  ctrl.saveAnswer,
);

// ------------------------------------------------------------------ proctor

examinationRoutes.post(
  '/examinations/attempts/:id/proctor/session',
  ...proctorAuth,
  validate(attemptIdParamsSchema, 'params'),
  ctrl.startProctorSession,
);

examinationRoutes.post(
  '/examinations/proctor/events',
  ...proctorAuth,
  validate(proctorEventSchema),
  ctrl.logProctorEvent,
);

examinationRoutes.post(
  '/examinations/attempts/:id/proctor/flag',
  ...proctorAuth,
  validate(attemptIdParamsSchema, 'params'),
  ctrl.flagAttempt,
);

examinationRoutes.post(
  '/examinations/attempts/:id/proctor/clear',
  ...proctorAuth,
  validate(attemptIdParamsSchema, 'params'),
  ctrl.clearAttempt,
);

examinationRoutes.post(
  '/examinations/attempts/:id/proctor/terminate',
  ...proctorAuth,
  validate(attemptIdParamsSchema, 'params'),
  ctrl.terminateAttempt,
);

// ------------------------------------------------------------------ item

examinationRoutes.post(
  '/examinations',
  ...writeAuth,
  validate(createExamSchema),
  ctrl.createExam,
);

examinationRoutes.get(
  '/examinations/:id',
  ...readAuth,
  validate(examIdParamsSchema, 'params'),
  ctrl.getExam,
);

examinationRoutes.patch(
  '/examinations/:id',
  ...writeAuth,
  validate(examIdParamsSchema, 'params'),
  validate(updateExamSchema),
  ctrl.updateExam,
);

examinationRoutes.delete(
  '/examinations/:id',
  ...writeAuth,
  validate(examIdParamsSchema, 'params'),
  ctrl.deleteExam,
);

examinationRoutes.post(
  '/examinations/:id/publish',
  ...writeAuth,
  validate(examIdParamsSchema, 'params'),
  ctrl.publishExam,
);

examinationRoutes.post(
  '/examinations/:id/schedule',
  ...writeAuth,
  validate(examIdParamsSchema, 'params'),
  ctrl.scheduleExam,
);

examinationRoutes.post(
  '/examinations/:id/cancel',
  ...writeAuth,
  validate(examIdParamsSchema, 'params'),
  ctrl.cancelExam,
);

examinationRoutes.post(
  '/examinations/:id/archive',
  ...writeAuth,
  validate(examIdParamsSchema, 'params'),
  ctrl.archiveExam,
);

examinationRoutes.post(
  '/examinations/:id/duplicate',
  ...writeAuth,
  validate(examIdParamsSchema, 'params'),
  ctrl.duplicateExam,
);

examinationRoutes.get(
  '/examinations/:id/seating',
  ...readAuth,
  validate(examIdParamsSchema, 'params'),
  ctrl.listSeating,
);

examinationRoutes.get(
  '/examinations/:id/live',
  ...proctorAuth,
  validate(examIdParamsSchema, 'params'),
  ctrl.getLiveMonitoring,
);

examinationRoutes.get(
  '/examinations/:id/violations',
  ...readAuth,
  validate(examIdParamsSchema, 'params'),
  ctrl.listViolations,
);

examinationRoutes.get(
  '/examinations/:id/attendance',
  ...readAuth,
  validate(examIdParamsSchema, 'params'),
  ctrl.listAttendance,
);

examinationRoutes.get(
  '/examinations/:id/analytics',
  ...readAuth,
  validate(examIdParamsSchema, 'params'),
  ctrl.getExamAnalytics,
);

export default examinationRoutes;
