/**
 * BullMQ queue definitions — scaffolding.
 * Processors live in apps/worker.
 */

export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  GRADING: 'grading',
  ANALYTICS: 'analytics',
  AUDIT: 'audit',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
