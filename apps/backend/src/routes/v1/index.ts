import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import institutionRoutes from './institution.routes.js';
import {
  healthCheck,
  livenessCheck,
  readinessCheck,
  versionCheck,
} from '../../controllers/health/health.controller.js';

/**
 * API v1 router.
 * Also exposes top-level aliases: /api/v1/live, /ready, /version
 */
const v1Router = Router();

v1Router.use('/health', healthRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use(institutionRoutes);
v1Router.get('/live', livenessCheck);
v1Router.get('/ready', readinessCheck);
v1Router.get('/version', versionCheck);
v1Router.get('/healthz', healthCheck);

export default v1Router;
