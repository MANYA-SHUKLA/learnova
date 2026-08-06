import type { Job } from 'bullmq';
import type { AnalyticsJobPayload } from '../jobs/index.js';
import { logger } from '../utils/logger.js';

export async function processAnalyticsJob(
  job: Job<AnalyticsJobPayload>,
): Promise<void> {
  logger.info(
    {
      jobId: job.id,
      metric: job.data.metric,
      institutionId: job.data.institutionId,
      correlationId: job.data.correlationId,
    },
    'Analytics job processed (scaffold)',
  );
}
