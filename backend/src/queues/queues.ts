import { Queue, QueueEvents } from 'bullmq';
import type { Redis } from 'ioredis';
import { QUEUE_LIST, QUEUE_NAMES, type QueueName } from '@learnova/constants';
import { bullmqConfig } from '../config/slices.js';
import { getRedis } from '../database/redis/connection.js';
import { logger } from '../utils/logger/index.js';
import { QueueError } from '../utils/errors/index.js';

export { QUEUE_NAMES, QUEUE_LIST, type QueueName };

const queues = new Map<QueueName, Queue>();
const queueEvents = new Map<QueueName, QueueEvents>();
const dlqQueues = new Map<string, Queue>();

function defaultJobOptions() {
  return {
    removeOnComplete: bullmqConfig.removeOnComplete,
    removeOnFail: bullmqConfig.removeOnFail,
    attempts: bullmqConfig.attempts,
    backoff: { type: 'exponential' as const, delay: bullmqConfig.backoffMs },
  };
}

export function getQueue(name: QueueName): Queue {
  const existing = queues.get(name);
  if (existing) return existing;
  throw new QueueError(`Queue "${name}" is not initialized. Call initQueues() during bootstrap.`);
}

export function getQueueEvents(name: QueueName): QueueEvents {
  const existing = queueEvents.get(name);
  if (existing) return existing;
  throw new QueueError(`QueueEvents for "${name}" not initialized`);
}

/** Dead-letter queue preparation — separate queue per source */
export function getDlq(name: QueueName): Queue {
  const dlqName = `${name}${bullmqConfig.dlqSuffix}`;
  const existing = dlqQueues.get(dlqName);
  if (existing) return existing;
  throw new QueueError(`DLQ "${dlqName}" is not initialized`);
}

export function initQueues(connection?: Redis): Promise<Map<QueueName, Queue>> {
  if (queues.size > 0) return Promise.resolve(queues);

  const redis = connection ?? getRedis();

  for (const name of QUEUE_LIST) {
    const queue = new Queue(name, {
      connection: redis,
      prefix: bullmqConfig.prefix,
      defaultJobOptions: defaultJobOptions(),
    });
    queues.set(name, queue);

    const events = new QueueEvents(name, {
      connection: redis.duplicate(),
      prefix: bullmqConfig.prefix,
    });
    events.on('failed', ({ jobId, failedReason }) => {
      logger.domain('bullmq', 'warn', 'Job failed', { queue: name, jobId, failedReason });
    });
    events.on('completed', ({ jobId }) => {
      logger.domain('bullmq', 'debug', 'Job completed', { queue: name, jobId });
    });
    queueEvents.set(name, events);

    const dlqName = `${name}${bullmqConfig.dlqSuffix}`;
    const dlq = new Queue(dlqName, {
      connection: redis,
      prefix: bullmqConfig.prefix,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 1000,
        attempts: 1,
      },
    });
    dlqQueues.set(dlqName, dlq);
  }

  logger.domain('bullmq', 'info', 'BullMQ queues initialized', {
    queues: [...queues.keys()],
    dlq: [...dlqQueues.keys()],
  });
  return Promise.resolve(queues);
}

export async function closeQueues(): Promise<void> {
  await Promise.all([
    ...[...queues.values()].map((q) => q.close()),
    ...[...queueEvents.values()].map((e) => e.close()),
    ...[...dlqQueues.values()].map((q) => q.close()),
  ]);
  queues.clear();
  queueEvents.clear();
  dlqQueues.clear();
  logger.domain('bullmq', 'info', 'BullMQ queues closed');
}

export async function getQueueHealth(): Promise<
  Record<string, { waiting: number; active: number; failed: number; delayed: number }>
> {
  const result: Record<
    string,
    { waiting: number; active: number; failed: number; delayed: number }
  > = {};
  for (const [name, queue] of queues) {
    const [waiting, active, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    result[name] = { waiting, active, failed, delayed };
  }
  return result;
}
