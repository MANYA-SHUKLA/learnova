import { Router } from 'express';
import healthRoutes from './health.routes.js';

/**
 * API v1 router.
 * Module routes (auth, lms, erp, …) mount here when implemented.
 * Auth routes are intentionally omitted — prepare only.
 */
const v1Router = Router();

v1Router.use('/health', healthRoutes);

// Future mounts (do not implement yet):
// v1Router.use('/auth', authRoutes);
// v1Router.use('/lms', lmsRoutes);
// v1Router.use('/erp', erpRoutes);
// v1Router.use('/examination', examinationRoutes);
// v1Router.use('/coding', codingRoutes);
// v1Router.use('/ide', ideRoutes);
// v1Router.use('/ideation', ideationRoutes);
// v1Router.use('/analytics', analyticsRoutes);
// v1Router.use('/audit', auditRoutes);

export default v1Router;
