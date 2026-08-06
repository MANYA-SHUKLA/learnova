import type { Job } from 'bullmq';
import type { EmailJobPayload } from '../jobs/index.js';
import { sendWorkerEmail } from '../mail/send.js';
import { logger } from '../utils/logger.js';

export async function processEmailJob(job: Job<EmailJobPayload>): Promise<void> {
  const result = await sendWorkerEmail(job.data);
  logger.info(
    {
      jobId: job.id,
      messageId: result.messageId,
      driver: result.driver,
      correlationId: job.data.correlationId,
    },
    'Email job completed',
  );
}
