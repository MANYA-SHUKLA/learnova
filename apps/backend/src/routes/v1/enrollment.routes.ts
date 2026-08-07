import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  createEnrollmentSchema,
  enrollmentBulkEnrollSchema,
  enrollmentBulkApproveSchema,
  enrollmentBulkRejectSchema,
  enrollmentBulkIdsSchema,
  enrollmentBulkAssignFacultySchema,
  enrollmentIdParamsSchema,
  enrollmentListQuerySchema,
  enrollmentSearchQuerySchema,
  enrollmentExportQuerySchema,
  enrollmentImportConfirmSchema,
  updateEnrollmentSchema,
  enrollmentSelfEnrollSchema,
  enrollmentRejectSchema,
  enrollmentWithdrawSchema,
  enrollmentWaitlistJoinSchema,
  enrollmentWaitlistLeaveSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/enrollment/enrollment.controller.js';

const enrollmentRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.ENROLLMENT_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.ENROLLMENT_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.ENROLLMENT_MANAGE),
] as RequestHandler[];

enrollmentRoutes.get(
  '/enrollments',
  ...readAuth,
  validate(enrollmentListQuerySchema, 'query'),
  ctrl.listEnrollments,
);

enrollmentRoutes.get(
  '/enrollments/search',
  ...readAuth,
  validate(enrollmentSearchQuerySchema, 'query'),
  ctrl.searchEnrollments,
);

enrollmentRoutes.get('/enrollments/stats', ...readAuth, ctrl.getEnrollmentStats);

enrollmentRoutes.get(
  '/enrollments/export',
  ...readAuth,
  validate(enrollmentExportQuerySchema, 'query'),
  ctrl.exportEnrollments,
);

enrollmentRoutes.get('/enrollments/audit', ...readAuth, ctrl.listEnrollmentAudit);

enrollmentRoutes.get('/enrollments/me', ...writeAuth, ctrl.getOwnEnrollments);

enrollmentRoutes.get('/enrollments/waitlist', ...readAuth, ctrl.getWaitlist);

enrollmentRoutes.post(
  '/enrollments',
  ...manageAuth,
  validate(createEnrollmentSchema),
  ctrl.createEnrollment,
);

enrollmentRoutes.post(
  '/enrollments/self',
  ...writeAuth,
  validate(enrollmentSelfEnrollSchema),
  ctrl.selfEnroll,
);

enrollmentRoutes.post(
  '/enrollments/waitlist/join',
  ...writeAuth,
  validate(enrollmentWaitlistJoinSchema),
  ctrl.joinWaitlist,
);

enrollmentRoutes.post(
  '/enrollments/waitlist/leave',
  ...writeAuth,
  validate(enrollmentWaitlistLeaveSchema),
  ctrl.leaveWaitlist,
);

enrollmentRoutes.post(
  '/enrollments/import/preview',
  ...manageAuth,
  validate(enrollmentImportConfirmSchema),
  ctrl.previewEnrollmentImport,
);

enrollmentRoutes.post(
  '/enrollments/import',
  ...manageAuth,
  validate(enrollmentImportConfirmSchema),
  ctrl.importEnrollments,
);

enrollmentRoutes.post(
  '/enrollments/bulk/enroll',
  ...manageAuth,
  validate(enrollmentBulkEnrollSchema),
  ctrl.bulkEnroll,
);

enrollmentRoutes.post(
  '/enrollments/bulk/approve',
  ...writeAuth,
  validate(enrollmentBulkApproveSchema),
  ctrl.bulkApprove,
);

enrollmentRoutes.post(
  '/enrollments/bulk/reject',
  ...writeAuth,
  validate(enrollmentBulkRejectSchema),
  ctrl.bulkReject,
);

enrollmentRoutes.post(
  '/enrollments/bulk/delete',
  ...manageAuth,
  validate(enrollmentBulkIdsSchema),
  ctrl.bulkDelete,
);

enrollmentRoutes.post(
  '/enrollments/bulk/assign-faculty',
  ...manageAuth,
  validate(enrollmentBulkAssignFacultySchema),
  ctrl.bulkAssignFaculty,
);

enrollmentRoutes.get(
  '/enrollments/:id',
  ...readAuth,
  validate(enrollmentIdParamsSchema, 'params'),
  ctrl.getEnrollment,
);

enrollmentRoutes.put(
  '/enrollments/:id',
  ...manageAuth,
  validate(enrollmentIdParamsSchema, 'params'),
  validate(updateEnrollmentSchema),
  ctrl.updateEnrollment,
);

enrollmentRoutes.patch(
  '/enrollments/:id',
  ...manageAuth,
  validate(enrollmentIdParamsSchema, 'params'),
  validate(updateEnrollmentSchema),
  ctrl.updateEnrollment,
);

enrollmentRoutes.delete(
  '/enrollments/:id',
  ...manageAuth,
  validate(enrollmentIdParamsSchema, 'params'),
  ctrl.archiveEnrollment,
);

enrollmentRoutes.post(
  '/enrollments/:id/restore',
  ...manageAuth,
  validate(enrollmentIdParamsSchema, 'params'),
  ctrl.restoreEnrollment,
);

enrollmentRoutes.post(
  '/enrollments/:id/approve',
  ...writeAuth,
  validate(enrollmentIdParamsSchema, 'params'),
  ctrl.approveEnrollment,
);

enrollmentRoutes.post(
  '/enrollments/:id/reject',
  ...writeAuth,
  validate(enrollmentIdParamsSchema, 'params'),
  validate(enrollmentRejectSchema),
  ctrl.rejectEnrollment,
);

enrollmentRoutes.post(
  '/enrollments/:id/withdraw',
  ...writeAuth,
  validate(enrollmentIdParamsSchema, 'params'),
  validate(enrollmentWithdrawSchema),
  ctrl.withdrawEnrollment,
);

enrollmentRoutes.post(
  '/enrollments/:id/complete',
  ...manageAuth,
  validate(enrollmentIdParamsSchema, 'params'),
  ctrl.completeEnrollment,
);

export default enrollmentRoutes;
