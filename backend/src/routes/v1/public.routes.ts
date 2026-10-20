import { Router } from 'express';
import {
  createDemoRequestSchema,
  publicPortalQuerySchema,
} from '@learnova/validation';
import { validate } from '../../middlewares/validate.middleware.js';
import { createAuthRateLimiter } from '../../middlewares/rate-limit.middleware.js';
import * as platformController from '../../controllers/platform/platform.controller.js';

const publicRoutes = Router();
const limiter = createAuthRateLimiter();

publicRoutes.get('/portal', validate(publicPortalQuerySchema, 'query'), platformController.getPublicPortal);
publicRoutes.get('/institutions', platformController.listPublicInstitutions);
publicRoutes.get('/platform-marketing', platformController.getPublicMarketing);
publicRoutes.post(
  '/demo-requests',
  limiter,
  validate(createDemoRequestSchema),
  platformController.createDemoRequest,
);

export default publicRoutes;
