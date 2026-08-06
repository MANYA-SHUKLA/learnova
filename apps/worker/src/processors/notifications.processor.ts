import type { Job } from 'bullmq';
import type { NotificationJobPayload } from '../jobs/index.js';
import { logger } from '../utils/logger.js';

export async function processNotificationJob(
  job: Job<NotificationJobPayload>,
): Promise<void> {
  logger.info(
    {
      jobId: job.id,
      userId: job.data.userId,
      channel: job.data.channel,
      title: job.data.title,
      correlationId: job.data.correlationId,
    },
    'Notification job processed (scaffold)',
  );
}
