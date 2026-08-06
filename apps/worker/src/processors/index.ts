import { type Job, Worker } from 'bullmq';
import { QUEUE_LIST, QUEUE_NAMES, type QueueName } from '@learnova/constants';
import { env } from '../config/env.js';
import { getRedisConnection } from '../connection/redis.js';
import { logger } from '../utils/logger.js';
import { processEmailJob } from './email.processor.js';
import { processNotificationJob } from './notifications.processor.js';
import { processGradingJob } from './grading.processor.js';
import { processAnalyticsJob } from './analytics.processor.js';
import { processAuditJob } from './audit.processor.js';
import {
  processAiJob,
  processCertificateJob,
  processCleanupJob,
  processCompileJob,
} from './scaffold.processors.js';

type Processor = (job: Job) => Promise<void>;

const processors: Record<QueueName, Processor> = {
  [QUEUE_NAMES.EMAIL]: (job) => processEmailJob(job),
  [QUEUE_NAMES.NOTIFICATIONS]: (job) => processNotificationJob(job),
  [QUEUE_NAMES.GRADING]: (job) => processGradingJob(job),
  [QUEUE_NAMES.ANALYTICS]: (job) => processAnalyticsJob(job),
  [QUEUE_NAMES.AUDIT]: (job) => processAuditJob(job),
  [QUEUE_NAMES.CERTIFICATE]: (job) => processCertificateJob(job),
  [QUEUE_NAMES.AI]: (job) => processAiJob(job),
  [QUEUE_NAMES.COMPILE]: (job) => processCompileJob(job),
  [QUEUE_NAMES.CLEANUP]: (job) => processCleanupJob(job),
};

export async function startWorkers(): Promise<Worker[]> {
  const connection = getRedisConnection();
  const concurrency = env.WORKER_CONCURRENCY;

  const workers = QUEUE_LIST.map(
    (name) =>
      new Worker(name, processors[name], {
        connection,
        concurrency,
      }),
  );

  for (const worker of workers) {
    worker.on('failed', (job, err) => {
      logger.domain('bullmq', 'error', 'Job failed', {
        err,
        jobId: job?.id,
        queue: worker.name,
      });
    });
    worker.on('completed', (job) => {
      logger.domain('bullmq', 'debug', 'Job completed', {
        jobId: job.id,
        queue: worker.name,
      });
    });
    worker.on('error', (err) => {
      logger.domain('bullmq', 'error', 'Worker error', { err, queue: worker.name });
    });
  }

  logger.info({ queues: [...QUEUE_LIST], concurrency }, 'Workers started');
  return workers;
}

export function getWorkerMetrics(workers: Worker[]) {
  return {
    count: workers.length,
    queues: workers.map((w) => w.name),
    concurrency: env.WORKER_CONCURRENCY,
  };
}
