import { type Job, Worker } from 'bullmq';
import { QUEUE_LIST, QUEUE_NAMES, type QueueName } from '@learnova/constants';
import type {
  AnalyticsJobPayload,
  AuditJobPayload,
  EmailJobPayload,
  GradingJobPayload,
  NotificationJobPayload,
} from '@learnova/types';
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
  [QUEUE_NAMES.EMAIL]: (job) => processEmailJob(job as Job<EmailJobPayload>),
  [QUEUE_NAMES.NOTIFICATIONS]: (job) =>
    processNotificationJob(job as Job<NotificationJobPayload>),
  [QUEUE_NAMES.GRADING]: (job) => processGradingJob(job as Job<GradingJobPayload>),
  [QUEUE_NAMES.ANALYTICS]: (job) => processAnalyticsJob(job as Job<AnalyticsJobPayload>),
  [QUEUE_NAMES.AUDIT]: (job) => processAuditJob(job as Job<AuditJobPayload>),
  [QUEUE_NAMES.CERTIFICATE]: (job) => processCertificateJob(job),
  [QUEUE_NAMES.AI]: (job) => processAiJob(job),
  [QUEUE_NAMES.COMPILE]: (job) => processCompileJob(job),
  [QUEUE_NAMES.CLEANUP]: (job) => processCleanupJob(job),
};

export function startWorkers(): Promise<Worker[]> {
  const connection = getRedisConnection();
  const concurrency = env.WORKER_CONCURRENCY;
  // Must match backend Queue `prefix` or jobs sit forever on the wrong Redis keyspace.
  const prefix = env.BULLMQ_PREFIX ?? 'learnova';

  const workers = QUEUE_LIST.map(
    (name) =>
      new Worker(name, processors[name], {
        connection,
        concurrency,
        prefix,
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

  logger.info({ queues: [...QUEUE_LIST], concurrency, prefix }, 'Workers started');
  return Promise.resolve(workers);
}

export function getWorkerMetrics(workers: Worker[]) {
  return {
    count: workers.length,
    queues: workers.map((w) => w.name),
    concurrency: env.WORKER_CONCURRENCY,
  };
}
