import { Router } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  confirmDemoRequestSchema,
  declineDemoRequestSchema,
  demoRequestListQuerySchema,
  institutionAdminLoginAuditQuerySchema,
  idParamsSchema,
  platformMarketingSchema,
  provisionCampusSchema,
  resendAdminCredentialsSchema,
} from '@learnova/validation';
import {
  authenticate,
  requirePermission,
  requireRole,
} from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as platformController from '../../controllers/platform/platform.controller.js';

const superAdminRoutes = Router();

const superAuth = [
  authenticate({ required: true }),
  requireRole('super_admin'),
] as const;

superAdminRoutes.get(
  '/demo-requests',
  ...superAuth,
  requirePermission(PERMISSIONS.DEMO_REQUEST_MANAGE),
  validate(demoRequestListQuerySchema, 'query'),
  platformController.listDemoRequests,
);

superAdminRoutes.get(
  '/institution-admin-logins',
  ...superAuth,
  requirePermission(PERMISSIONS.AUDIT_READ),
  validate(institutionAdminLoginAuditQuerySchema, 'query'),
  platformController.listInstitutionAdminLogins,
);

superAdminRoutes.post(
  '/demo-requests/:id/confirm',
  ...superAuth,
  requirePermission(PERMISSIONS.DEMO_REQUEST_MANAGE),
  validate(idParamsSchema, 'params'),
  validate(confirmDemoRequestSchema),
  platformController.confirmDemoRequest,
);

superAdminRoutes.post(
  '/demo-requests/:id/decline',
  ...superAuth,
  requirePermission(PERMISSIONS.DEMO_REQUEST_MANAGE),
  validate(idParamsSchema, 'params'),
  validate(declineDemoRequestSchema),
  platformController.declineDemoRequest,
);

superAdminRoutes.post(
  '/institutions',
  ...superAuth,
  requirePermission(PERMISSIONS.INSTITUTION_MANAGE),
  validate(provisionCampusSchema),
  platformController.provisionCampus,
);

superAdminRoutes.post(
  '/institutions/:id/resend-admin-credentials',
  ...superAuth,
  requirePermission(PERMISSIONS.INSTITUTION_MANAGE),
  validate(idParamsSchema, 'params'),
  validate(resendAdminCredentialsSchema),
  platformController.resendAdminCredentials,
);

superAdminRoutes.get(
  '/platform-marketing',
  ...superAuth,
  requirePermission(PERMISSIONS.PLATFORM_MANAGE),
  platformController.getPublicMarketing,
);

superAdminRoutes.put(
  '/platform-marketing',
  ...superAuth,
  requirePermission(PERMISSIONS.PLATFORM_MANAGE),
  validate(platformMarketingSchema),
  platformController.updateMarketing,
);

export default superAdminRoutes;
