import { JOB_NAMES } from '@learnova/types';
import type {
  AnalyticsJobPayload,
  AuditJobPayload,
  EmailJobPayload,
  GradingJobPayload,
  NotificationJobPayload,
} from '@learnova/types';
import { QUEUE_NAMES } from '@learnova/constants';
import { getQueue } from './queues.js';
import { logger } from '../utils/logger/index.js';

async function addJob<T extends { correlationId?: string }>(
  queueName: (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES],
  jobName: string,
  payload: T,
  opts?: { jobId?: string; delay?: number },
): Promise<string | undefined> {
  const queue = getQueue(queueName);
  const job = await queue.add(jobName, payload, {
    jobId: opts?.jobId,
    delay: opts?.delay,
  });
  logger.debug(
    { queue: queueName, jobName, jobId: job.id, correlationId: payload.correlationId },
    'Job enqueued',
  );
  return job.id;
}

export async function enqueueEmail(
  payload: EmailJobPayload,
  opts?: { jobId?: string; delay?: number },
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.EMAIL, JOB_NAMES.SEND_EMAIL, payload, opts);
}

export async function enqueueNotification(
  payload: NotificationJobPayload,
  opts?: { jobId?: string; delay?: number },
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.NOTIFICATIONS, JOB_NAMES.SEND_NOTIFICATION, payload, opts);
}

export async function enqueueGrading(
  payload: GradingJobPayload,
  opts?: { jobId?: string; delay?: number },
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.GRADING, JOB_NAMES.GRADE_SUBMISSION, payload, opts);
}

export async function enqueueAnalytics(
  payload: AnalyticsJobPayload,
  opts?: { jobId?: string; delay?: number },
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.ANALYTICS, JOB_NAMES.TRACK_ANALYTICS, payload, opts);
}

export async function enqueueAudit(
  payload: AuditJobPayload,
  opts?: { jobId?: string; delay?: number },
): Promise<string | undefined> {
  return addJob(QUEUE_NAMES.AUDIT, JOB_NAMES.WRITE_AUDIT, payload, opts);
}
