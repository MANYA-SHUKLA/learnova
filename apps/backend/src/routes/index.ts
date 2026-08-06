import { Router } from 'express';
import v1Router from './v1/index.js';
import internalRouter from './internal/index.js';
import webhooksRouter from './webhooks/index.js';
import { appConfig } from '../config/app.js';

/**
 * Top-level API mounts.
 *
 *   /api/v1/*         — public versioned product API
 *   /api/internal/*   — service-to-service / admin ops (auth later)
 *   /api/webhooks/*   — inbound provider webhooks (Judge0, mail, payments)
 */
const router = Router();

router.use(appConfig.apiPrefix, v1Router);
router.use('/api/internal', internalRouter);
router.use('/api/webhooks', webhooksRouter);

export default router;
