import type { Job } from 'bullmq';
import type { GradingJobPayload } from '../jobs/index.js';
import { logger } from '../utils/logger.js';

export async function processGradingJob(job: Job<GradingJobPayload>): Promise<void> {
  logger.info(
    {
      jobId: job.id,
      submissionId: job.data.submissionId,
      examId: job.data.examId,
      labId: job.data.labId,
      correlationId: job.data.correlationId,
    },
    'Grading job processed (scaffold)',
  );
}
