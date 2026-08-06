import { Router } from 'express';
import {
  healthCheck,
  livenessCheck,
  readinessCheck,
  versionCheck,
} from '../../controllers/health/health.controller.js';

const router = Router();

router.get('/', healthCheck);
router.get('/live', livenessCheck);
router.get('/ready', readinessCheck);
router.get('/version', versionCheck);

export default router;
