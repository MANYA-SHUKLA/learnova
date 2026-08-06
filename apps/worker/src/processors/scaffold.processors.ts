import type { Job } from 'bullmq';
import { logger } from '../utils/logger.js';

async function scaffold(job: Job, label: string): Promise<void> {
  logger.info(
    { jobId: job.id, name: job.name, queue: job.queueName, data: job.data },
    `${label} job processed (scaffold)`,
  );
}

export async function processCertificateJob(job: Job): Promise<void> {
  await scaffold(job, 'Certificate');
}

export async function processAiJob(job: Job): Promise<void> {
  await scaffold(job, 'AI');
}

export async function processCompileJob(job: Job): Promise<void> {
  await scaffold(job, 'Compile');
}

export async function processCleanupJob(job: Job): Promise<void> {
  await scaffold(job, 'Cleanup');
}
