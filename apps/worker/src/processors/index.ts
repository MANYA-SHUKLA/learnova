import { type Job, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { QUEUE_NAMES, type QueueName } from '../queues/names.js';

/**
 * Worker processors — scaffolding only.
 * Each queue gets a no-op-safe processor that logs job receipt.
 * Real business logic lands when features are implemented.
 */

async function createConnection(): Promise<Redis> {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  return redis;
}

async function defaultProcessor(job: Job): Promise<void> {
  logger.info(
    { queue: job.queueName, jobId: job.id, name: job.name },
    'Job received (processor scaffold)',
  );
}

export async function startWorkers(): Promise<Worker[]> {
  const connection = await createConnection();
  const concurrency = env.WORKER_CONCURRENCY;

  const queueList: QueueName[] = [
    QUEUE_NAMES.EMAIL,
    QUEUE_NAMES.NOTIFICATIONS,
    QUEUE_NAMES.GRADING,
    QUEUE_NAMES.ANALYTICS,
    QUEUE_NAMES.AUDIT,
  ];

  const workers = queueList.map(
    (name) =>
      new Worker(name, defaultProcessor, {
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
  }

  logger.info({ queues: queueList, concurrency }, 'Workers started');
  return workers;
}
