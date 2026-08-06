import { JOB_NAMES } from '@learnova/types';
import type {
  AnalyticsJobPayload,
  AuditJobPayload,
  EmailJobPayload,
  GradingJobPayload,
  NotificationJobPayload,
} from '@learnova/types';
import { QUEUE_NAMES, type QueueName } from '@learnova/constants';
import { getQueue } from './queues.js';
import { logger } from '../utils/logger/index.js';

export interface EnqueueOptions {
  jobId?: string;
  delay?: number;
  priority?: number;
}

async function addJob(
  queueName: QueueName,
  jobName: string,
  payload: { correlationId?: string },
  opts?: EnqueueOptions,
): Promise<string | undefined> {
  const queue = getQueue(queueName);
  const job = await queue.add(jobName, payload, {
    jobId: opts?.jobId,
    delay: opts?.delay,
    priority: opts?.priority,
  });
  logger.domain('bullmq', 'debug', 'Job enqueued', {
    queue: queueName,
    jobName,
    jobId: job.id,
    priority: opts?.priority,
    correlationId: payload.correlationId,
  });
  return job.id;
}

export async function enqueueEmail(
  payload: EmailJobPayload,
  opts?: EnqueueOptions,
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.EMAIL, JOB_NAMES.SEND_EMAIL, payload, opts);
}

export async function enqueueNotification(
  payload: NotificationJobPayload,
  opts?: EnqueueOptions,
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.NOTIFICATIONS, JOB_NAMES.SEND_NOTIFICATION, payload, opts);
}

export async function enqueueGrading(
  payload: GradingJobPayload,
  opts?: EnqueueOptions,
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.GRADING, JOB_NAMES.GRADE_SUBMISSION, payload, opts);
}

export async function enqueueAnalytics(
  payload: AnalyticsJobPayload,
  opts?: EnqueueOptions,
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.ANALYTICS, JOB_NAMES.TRACK_ANALYTICS, payload, opts);
}

export async function enqueueAudit(
  payload: AuditJobPayload,
  opts?: EnqueueOptions,
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.AUDIT, JOB_NAMES.WRITE_AUDIT, payload, opts);
}

export async function enqueueCertificate(
  payload: Record<string, unknown> & { correlationId?: string },
  opts?: EnqueueOptions,
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.CERTIFICATE, 'generate-certificate', payload, opts);
}

export async function enqueueAi(
  payload: Record<string, unknown> & { correlationId?: string },
  opts?: EnqueueOptions,
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.AI, 'ai-task', payload, opts);
}

export async function enqueueCompile(
  payload: Record<string, unknown> & { correlationId?: string },
  opts?: EnqueueOptions,
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.COMPILE, 'compile-code', payload, opts);
}

export async function enqueueCleanup(
  payload: Record<string, unknown> & { correlationId?: string },
  opts?: EnqueueOptions,
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.CLEANUP, 'cleanup-task', payload, opts);
}
