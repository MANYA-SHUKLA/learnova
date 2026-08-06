import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { QUEUE_NAMES, type QueueName } from '@learnova/constants';
import { getRedis } from '../database/redis/connection.js';
import { logger } from '../utils/logger/index.js';

export { QUEUE_NAMES, type QueueName };

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  const existing = queues.get(name);
  if (existing) return existing;
  throw new Error(`Queue "${name}" is not initialized. Call initQueues() during bootstrap.`);
}

export async function initQueues(connection?: Redis): Promise<Map<QueueName, Queue>> {
  if (queues.size > 0) return queues;

  const redis = connection ?? getRedis();
  for (const name of Object.values(QUEUE_NAMES)) {
    const queue = new Queue(name, {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });
    queues.set(name, queue);
  }

  logger.info({ queues: [...queues.keys()] }, 'BullMQ queues initialized');
  return queues;
}

export async function closeQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((q) => q.close()));
  queues.clear();
  logger.info('BullMQ queues closed');
}

export async function getQueueHealth(): Promise<Record<QueueName, { waiting: number; active: number }>> {
  const result = {} as Record<QueueName, { waiting: number; active: number }>;
  for (const [name, queue] of queues) {
    const [waiting, active] = await Promise.all([queue.getWaitingCount(), queue.getActiveCount()]);
    result[name] = { waiting, active };
  }
  return result;
}
