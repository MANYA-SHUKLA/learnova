import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  createStudentSchema,
  studentBulkAssignBatchSchema,
  studentBulkAssignDepartmentSchema,
  studentBulkAssignSectionSchema,
  studentBulkAssignSemesterSchema,
  studentBulkIdsSchema,
  studentBulkStatusSchema,
  studentExportQuerySchema,
  studentIdParamsSchema,
  studentImportConfirmSchema,
  studentListQuerySchema,
  studentPhotoUploadSchema,
  studentSearchQuerySchema,
  updateStudentProfileSchema,
  updateStudentSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import {
  facultyStudentGuard,
  studentOwnershipGuard,
  tenantGuard,
} from '../../middlewares/scope.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/student/student.controller.js';

const studentRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  tenantGuard(),
  requirePermission(PERMISSIONS.STUDENT_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  tenantGuard(),
  requirePermission(PERMISSIONS.STUDENT_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  tenantGuard(),
  requirePermission(PERMISSIONS.STUDENT_MANAGE),
] as RequestHandler[];

studentRoutes.get(
  '/students',
  ...readAuth,
  validate(studentListQuerySchema, 'query'),
  ctrl.listStudents,
);

studentRoutes.get(
  '/students/search',
  ...readAuth,
  validate(studentSearchQuerySchema, 'query'),
  ctrl.searchStudents,
);

studentRoutes.get('/students/stats', ...readAuth, ctrl.getStudentStats);

studentRoutes.get(
  '/students/export',
  ...readAuth,
  validate(studentExportQuerySchema, 'query'),
  ctrl.exportStudents,
);

studentRoutes.get('/students/audit', ...readAuth, ctrl.listStudentAudit);

studentRoutes.get('/students/me', ...writeAuth, ctrl.getOwnStudentProfile);

studentRoutes.patch(
  '/students/me',
  ...writeAuth,
  validate(updateStudentProfileSchema),
  ctrl.updateOwnStudentProfile,
);

studentRoutes.post(
  '/students',
  ...manageAuth,
  validate(createStudentSchema),
  ctrl.createStudent,
);

studentRoutes.post(
  '/students/import/preview',
  ...manageAuth,
  validate(studentImportConfirmSchema),
  ctrl.previewStudentImport,
);

studentRoutes.post(
  '/students/import',
  ...manageAuth,
  validate(studentImportConfirmSchema),
  ctrl.importStudents,
);

studentRoutes.post(
  '/students/bulk/archive',
  ...manageAuth,
  validate(studentBulkIdsSchema),
  ctrl.bulkArchiveStudents,
);

studentRoutes.post(
  '/students/bulk/activate',
  ...manageAuth,
  validate(studentBulkIdsSchema),
  ctrl.bulkActivateStudents,
);

studentRoutes.post(
  '/students/bulk/suspend',
  ...manageAuth,
  validate(studentBulkIdsSchema),
  ctrl.bulkSuspendStudents,
);

studentRoutes.post(
  '/students/bulk/status',
  ...manageAuth,
  validate(studentBulkStatusSchema),
  ctrl.bulkStatusStudents,
);

studentRoutes.post(
  '/students/bulk/assign-department',
  ...manageAuth,
  validate(studentBulkAssignDepartmentSchema),
  ctrl.bulkAssignDepartment,
);

studentRoutes.post(
  '/students/bulk/assign-section',
  ...manageAuth,
  validate(studentBulkAssignSectionSchema),
  ctrl.bulkAssignSection,
);

studentRoutes.post(
  '/students/bulk/assign-semester',
  ...manageAuth,
  validate(studentBulkAssignSemesterSchema),
  ctrl.bulkAssignSemester,
);

studentRoutes.post(
  '/students/bulk/assign-batch',
  ...manageAuth,
  validate(studentBulkAssignBatchSchema),
  ctrl.bulkAssignBatch,
);

studentRoutes.get(
  '/students/:id',
  ...readAuth,
  validate(studentIdParamsSchema, 'params'),
  ctrl.getStudent,
);

studentRoutes.put(
  '/students/:id',
  ...manageAuth,
  validate(studentIdParamsSchema, 'params'),
  validate(updateStudentSchema),
  ctrl.updateStudent,
);

studentRoutes.patch(
  '/students/:id',
  ...manageAuth,
  validate(studentIdParamsSchema, 'params'),
  validate(updateStudentSchema),
  ctrl.updateStudent,
);

studentRoutes.delete(
  '/students/:id',
  ...manageAuth,
  validate(studentIdParamsSchema, 'params'),
  ctrl.archiveStudent,
);

studentRoutes.post(
  '/students/:id/restore',
  ...manageAuth,
  validate(studentIdParamsSchema, 'params'),
  ctrl.restoreStudent,
);

studentRoutes.post(
  '/students/:id/activate',
  ...manageAuth,
  validate(studentIdParamsSchema, 'params'),
  ctrl.activateStudent,
);

studentRoutes.post(
  '/students/:id/deactivate',
  ...manageAuth,
  validate(studentIdParamsSchema, 'params'),
  ctrl.deactivateStudent,
);

studentRoutes.post(
  '/students/:id/photo',
  ...writeAuth,
  validate(studentIdParamsSchema, 'params'),
  validate(studentPhotoUploadSchema),
  ctrl.uploadStudentPhoto,
);

studentRoutes.delete(
  '/students/:id/photo',
  ...writeAuth,
  validate(studentIdParamsSchema, 'params'),
  ctrl.removeStudentPhoto,
);

export default studentRoutes;
