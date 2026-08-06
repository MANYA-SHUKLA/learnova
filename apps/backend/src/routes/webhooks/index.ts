import { Router } from 'express';

/**
 * Inbound webhooks from external providers.
 * Verify signatures per provider before trusting payloads.
 */
const webhooksRouter = Router();

webhooksRouter.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok', scope: 'webhooks' },
    timestamp: new Date().toISOString(),
  });
});

// Future mounts (do not implement yet):
// webhooksRouter.use('/judge0', judge0WebhookRoutes);
// webhooksRouter.use('/mail', mailWebhookRoutes);
// webhooksRouter.use('/payments', paymentWebhookRoutes);

export default webhooksRouter;
