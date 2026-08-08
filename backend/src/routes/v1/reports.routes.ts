import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import { reportsExportQuerySchema, reportsQuerySchema } from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/reports/reports.controller.js';

const reportsRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.ANALYTICS_READ),
] as RequestHandler[];

const exportAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.ANALYTICS_EXPORT),
] as RequestHandler[];

reportsRoutes.get(
  '/reports/institution',
  ...readAuth,
  validate(reportsQuerySchema, 'query'),
  ctrl.institutionReport,
);

reportsRoutes.get(
  '/reports/faculty',
  ...readAuth,
  validate(reportsQuerySchema, 'query'),
  ctrl.facultyReport,
);

reportsRoutes.get(
  '/reports/student',
  ...readAuth,
  ctrl.studentReport,
);

reportsRoutes.get(
  '/reports/export',
  ...exportAuth,
  validate(reportsExportQuerySchema, 'query'),
  ctrl.exportReport,
);

export default reportsRoutes;
