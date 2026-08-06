import { type Job, Worker } from 'bullmq';
import { QUEUE_NAMES, type QueueName } from '@learnova/constants';
import { env } from '../config/env.js';
import { getRedisConnection } from '../connection/redis.js';
import { logger } from '../utils/logger.js';
import { processEmailJob } from './email.processor.js';
import { processNotificationJob } from './notifications.processor.js';
import { processGradingJob } from './grading.processor.js';
import { processAnalyticsJob } from './analytics.processor.js';
import { processAuditJob } from './audit.processor.js';

type Processor = (job: Job) => Promise<void>;

const processors: Record<QueueName, Processor> = {
  [QUEUE_NAMES.EMAIL]: (job) => processEmailJob(job),
  [QUEUE_NAMES.NOTIFICATIONS]: (job) => processNotificationJob(job),
  [QUEUE_NAMES.GRADING]: (job) => processGradingJob(job),
  [QUEUE_NAMES.ANALYTICS]: (job) => processAnalyticsJob(job),
  [QUEUE_NAMES.AUDIT]: (job) => processAuditJob(job),
};

/**
 * Background worker framework — one Worker per queue, typed processors.
 * Business logic expands inside each processor; framework stays stable.
 */
export async function startWorkers(): Promise<Worker[]> {
  const connection = getRedisConnection();
  const concurrency = env.WORKER_CONCURRENCY;

  const workers = (Object.values(QUEUE_NAMES) as QueueName[]).map(
    (name) =>
      new Worker(name, processors[name], {
        connection,
        concurrency,
      }),
  );

  for (const worker of workers) {
    worker.on('failed', (job, err) => {
      logger.error({ err, jobId: job?.id, queue: worker.name }, 'Job failed');
    });
    worker.on('completed', (job) => {
      logger.debug({ jobId: job.id, queue: worker.name }, 'Job completed');
    });
    worker.on('error', (err) => {
      logger.error({ err, queue: worker.name }, 'Worker error');
    });
  }

  logger.info({ queues: Object.values(QUEUE_NAMES), concurrency }, 'Workers started');
  return workers;
}
