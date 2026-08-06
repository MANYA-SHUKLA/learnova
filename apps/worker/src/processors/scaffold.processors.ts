import type { Job } from 'bullmq';
import { logger } from '../utils/logger.js';

function scaffold(job: Job, label: string): Promise<void> {
  logger.info(
    { jobId: job.id, name: job.name, queue: job.queueName, data: job.data },
    `${label} job processed (scaffold)`,
  );
  return Promise.resolve();
}

export function processCertificateJob(job: Job): Promise<void> {
  return scaffold(job, 'Certificate');
}

export function processAiJob(job: Job): Promise<void> {
  return scaffold(job, 'AI');
}

export function processCompileJob(job: Job): Promise<void> {
  return scaffold(job, 'Compile');
}

export function processCleanupJob(job: Job): Promise<void> {
  return scaffold(job, 'Cleanup');
}
