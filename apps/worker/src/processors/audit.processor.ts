import type { Job } from 'bullmq';
import type { AuditJobPayload } from '../jobs/index.js';
import { logger } from '../utils/logger.js';

export function processAuditJob(job: Job<AuditJobPayload>): Promise<void> {
  logger.audit('Audit event recorded', {
    jobId: job.id,
    actorId: job.data.actorId,
    action: job.data.action,
    resource: job.data.resource,
    resourceId: job.data.resourceId,
    correlationId: job.data.correlationId,
  });
  return Promise.resolve();
}
