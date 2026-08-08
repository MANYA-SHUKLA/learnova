import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  createCourseSchema,
  courseBulkAssignFacultySchema,
  courseBulkAssignProgramSchema,
  courseBulkAssignSemesterSchema,
  courseBulkIdsSchema,
  courseBulkStatusSchema,
  courseExportQuerySchema,
  courseIdParamsSchema,
  courseImportConfirmSchema,
  courseListQuerySchema,
  courseSearchQuerySchema,
  courseThumbnailUploadSchema,
  updateCourseSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { tenantGuard } from '../../middlewares/scope.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/course/course.controller.js';

const courseRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  tenantGuard(),
  requirePermission(PERMISSIONS.COURSE_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  tenantGuard(),
  requirePermission(PERMISSIONS.COURSE_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  tenantGuard(),
  requirePermission(PERMISSIONS.COURSE_MANAGE),
] as RequestHandler[];

courseRoutes.get(
  '/courses',
  ...readAuth,
  validate(courseListQuerySchema, 'query'),
  ctrl.listCourses,
);

courseRoutes.get(
  '/courses/search',
  ...readAuth,
  validate(courseSearchQuerySchema, 'query'),
  ctrl.searchCourses,
);

courseRoutes.get('/courses/stats', ...readAuth, ctrl.getCourseStats);

courseRoutes.get(
  '/courses/export',
  ...readAuth,
  validate(courseExportQuerySchema, 'query'),
  ctrl.exportCourses,
);

courseRoutes.get('/courses/audit', ...readAuth, ctrl.listCourseAudit);

courseRoutes.post(
  '/courses',
  ...manageAuth,
  validate(createCourseSchema),
  ctrl.createCourse,
);

courseRoutes.post(
  '/courses/import/preview',
  ...manageAuth,
  validate(courseImportConfirmSchema),
  ctrl.previewCourseImport,
);

courseRoutes.post(
  '/courses/import',
  ...manageAuth,
  validate(courseImportConfirmSchema),
  ctrl.importCourses,
);

courseRoutes.post(
  '/courses/bulk/publish',
  ...manageAuth,
  validate(courseBulkIdsSchema),
  ctrl.bulkPublishCourses,
);

courseRoutes.post(
  '/courses/bulk/unpublish',
  ...manageAuth,
  validate(courseBulkIdsSchema),
  ctrl.bulkUnpublishCourses,
);

courseRoutes.post(
  '/courses/bulk/archive',
  ...manageAuth,
  validate(courseBulkIdsSchema),
  ctrl.bulkArchiveCourses,
);

courseRoutes.post(
  '/courses/bulk/delete',
  ...manageAuth,
  validate(courseBulkIdsSchema),
  ctrl.bulkDeleteCourses,
);

courseRoutes.post(
  '/courses/bulk/status',
  ...manageAuth,
  validate(courseBulkStatusSchema),
  ctrl.bulkStatusCourses,
);

courseRoutes.post(
  '/courses/bulk/assign-faculty',
  ...manageAuth,
  validate(courseBulkAssignFacultySchema),
  ctrl.bulkAssignFaculty,
);

courseRoutes.post(
  '/courses/bulk/assign-program',
  ...manageAuth,
  validate(courseBulkAssignProgramSchema),
  ctrl.bulkAssignProgram,
);

courseRoutes.post(
  '/courses/bulk/assign-semester',
  ...manageAuth,
  validate(courseBulkAssignSemesterSchema),
  ctrl.bulkAssignSemester,
);

courseRoutes.get(
  '/courses/:id',
  ...readAuth,
  validate(courseIdParamsSchema, 'params'),
  ctrl.getCourse,
);

courseRoutes.put(
  '/courses/:id',
  ...manageAuth,
  validate(courseIdParamsSchema, 'params'),
  validate(updateCourseSchema),
  ctrl.updateCourse,
);

courseRoutes.patch(
  '/courses/:id',
  ...manageAuth,
  validate(courseIdParamsSchema, 'params'),
  validate(updateCourseSchema),
  ctrl.updateCourse,
);

courseRoutes.delete(
  '/courses/:id',
  ...manageAuth,
  validate(courseIdParamsSchema, 'params'),
  ctrl.archiveCourse,
);

courseRoutes.post(
  '/courses/:id/restore',
  ...manageAuth,
  validate(courseIdParamsSchema, 'params'),
  ctrl.restoreCourse,
);

courseRoutes.post(
  '/courses/:id/publish',
  ...manageAuth,
  validate(courseIdParamsSchema, 'params'),
  ctrl.publishCourse,
);

courseRoutes.post(
  '/courses/:id/unpublish',
  ...manageAuth,
  validate(courseIdParamsSchema, 'params'),
  ctrl.unpublishCourse,
);

courseRoutes.post(
  '/courses/:id/archive',
  ...manageAuth,
  validate(courseIdParamsSchema, 'params'),
  ctrl.archiveStatusCourse,
);

courseRoutes.post(
  '/courses/:id/duplicate',
  ...manageAuth,
  validate(courseIdParamsSchema, 'params'),
  ctrl.duplicateCourse,
);

courseRoutes.post(
  '/courses/:id/thumbnail',
  ...writeAuth,
  validate(courseIdParamsSchema, 'params'),
  validate(courseThumbnailUploadSchema),
  ctrl.uploadCourseThumbnail,
);

courseRoutes.delete(
  '/courses/:id/thumbnail',
  ...writeAuth,
  validate(courseIdParamsSchema, 'params'),
  ctrl.removeCourseThumbnail,
);

export default courseRoutes;
