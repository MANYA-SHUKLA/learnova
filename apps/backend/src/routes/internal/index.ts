import { Router } from 'express';

/**
 * Internal API — not for public clients.
 * Mount service auth / mTLS / network policies before adding routes.
 */
const internalRouter = Router();

internalRouter.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok', scope: 'internal' },
    timestamp: new Date().toISOString(),
  });
});

// Future mounts (do not implement yet):
// internalRouter.use('/jobs', jobAdminRoutes);
// internalRouter.use('/cache', cacheAdminRoutes);

export default internalRouter;
