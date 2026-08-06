import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  createFacultySchema,
  facultyBulkAssignDepartmentSchema,
  facultyBulkAssignProgramSchema,
  facultyBulkAssignAcademicSchema,
  facultyBulkIdsSchema,
  facultyBulkStatusSchema,
  facultyExportQuerySchema,
  facultyIdParamsSchema,
  facultyImportConfirmSchema,
  facultyListQuerySchema,
  facultyPhotoUploadSchema,
  facultySearchQuerySchema,
  updateFacultyProfileSchema,
  updateFacultySchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/faculty/faculty.controller.js';

const facultyRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.FACULTY_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.FACULTY_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.FACULTY_MANAGE),
] as RequestHandler[];

facultyRoutes.get(
  '/faculty',
  ...readAuth,
  validate(facultyListQuerySchema, 'query'),
  ctrl.listFaculty,
);

facultyRoutes.get(
  '/faculty/search',
  ...readAuth,
  validate(facultySearchQuerySchema, 'query'),
  ctrl.searchFaculty,
);

facultyRoutes.get('/faculty/stats', ...readAuth, ctrl.getFacultyStats);

facultyRoutes.get(
  '/faculty/export',
  ...readAuth,
  validate(facultyExportQuerySchema, 'query'),
  ctrl.exportFaculty,
);

facultyRoutes.get('/faculty/audit', ...readAuth, ctrl.listFacultyAudit);

facultyRoutes.get('/faculty/me', ...writeAuth, ctrl.getOwnFacultyProfile);

facultyRoutes.patch(
  '/faculty/me',
  ...writeAuth,
  validate(updateFacultyProfileSchema),
  ctrl.updateOwnFacultyProfile,
);

facultyRoutes.post(
  '/faculty',
  ...manageAuth,
  validate(createFacultySchema),
  ctrl.createFaculty,
);

facultyRoutes.post(
  '/faculty/import/preview',
  ...manageAuth,
  validate(facultyImportConfirmSchema),
  ctrl.previewFacultyImport,
);

facultyRoutes.post(
  '/faculty/import',
  ...manageAuth,
  validate(facultyImportConfirmSchema),
  ctrl.importFaculty,
);

facultyRoutes.post(
  '/faculty/bulk/archive',
  ...manageAuth,
  validate(facultyBulkIdsSchema),
  ctrl.bulkArchiveFaculty,
);

facultyRoutes.post(
  '/faculty/bulk/activate',
  ...manageAuth,
  validate(facultyBulkIdsSchema),
  ctrl.bulkActivateFaculty,
);

facultyRoutes.post(
  '/faculty/bulk/suspend',
  ...manageAuth,
  validate(facultyBulkIdsSchema),
  ctrl.bulkSuspendFaculty,
);

facultyRoutes.post(
  '/faculty/bulk/status',
  ...manageAuth,
  validate(facultyBulkStatusSchema),
  ctrl.bulkStatusFaculty,
);

facultyRoutes.post(
  '/faculty/bulk/assign-department',
  ...manageAuth,
  validate(facultyBulkAssignDepartmentSchema),
  ctrl.bulkAssignDepartment,
);

facultyRoutes.post(
  '/faculty/bulk/assign-program',
  ...manageAuth,
  validate(facultyBulkAssignProgramSchema),
  ctrl.bulkAssignProgram,
);

facultyRoutes.post(
  '/faculty/bulk/assign-academic',
  ...manageAuth,
  validate(facultyBulkAssignAcademicSchema),
  ctrl.bulkAssignAcademic,
);

facultyRoutes.get(
  '/faculty/:id',
  ...readAuth,
  validate(facultyIdParamsSchema, 'params'),
  ctrl.getFaculty,
);

facultyRoutes.put(
  '/faculty/:id',
  ...manageAuth,
  validate(facultyIdParamsSchema, 'params'),
  validate(updateFacultySchema),
  ctrl.updateFaculty,
);

facultyRoutes.patch(
  '/faculty/:id',
  ...manageAuth,
  validate(facultyIdParamsSchema, 'params'),
  validate(updateFacultySchema),
  ctrl.updateFaculty,
);

facultyRoutes.delete(
  '/faculty/:id',
  ...manageAuth,
  validate(facultyIdParamsSchema, 'params'),
  ctrl.archiveFaculty,
);

facultyRoutes.post(
  '/faculty/:id/restore',
  ...manageAuth,
  validate(facultyIdParamsSchema, 'params'),
  ctrl.restoreFaculty,
);

facultyRoutes.post(
  '/faculty/:id/activate',
  ...manageAuth,
  validate(facultyIdParamsSchema, 'params'),
  ctrl.activateFaculty,
);

facultyRoutes.post(
  '/faculty/:id/deactivate',
  ...manageAuth,
  validate(facultyIdParamsSchema, 'params'),
  ctrl.deactivateFaculty,
);

facultyRoutes.post(
  '/faculty/:id/photo',
  ...writeAuth,
  validate(facultyIdParamsSchema, 'params'),
  validate(facultyPhotoUploadSchema),
  ctrl.uploadFacultyPhoto,
);

facultyRoutes.delete(
  '/faculty/:id/photo',
  ...writeAuth,
  validate(facultyIdParamsSchema, 'params'),
  ctrl.removeFacultyPhoto,
);

export default facultyRoutes;
