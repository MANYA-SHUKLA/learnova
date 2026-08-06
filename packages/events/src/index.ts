/**
 * Domain event names — use for EventEmitter, queues, and audit trails.
 * Prefer dotted lowercase: domain.action
 */

export const EVENTS = {
  // Course / LMS
  COURSE_CREATED: 'course.created',
  COURSE_UPDATED: 'course.updated',
  COURSE_ARCHIVED: 'course.archived',
  COURSE_ENROLLED: 'course.enrolled',

  // Exam
  EXAM_CREATED: 'exam.created',
  EXAM_STARTED: 'exam.started',
  EXAM_COMPLETED: 'exam.completed',
  EXAM_CANCELLED: 'exam.cancelled',

  // Projects / ideation
  PROJECT_CREATED: 'project.created',
  PROJECT_SUBMITTED: 'project.submitted',
  PROJECT_GRADED: 'project.graded',

  // Certificates
  CERTIFICATE_GENERATED: 'certificate.generated',
  CERTIFICATE_REVOKED: 'certificate.revoked',

  // Auth / users (emit when auth ships — names reserved)
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',

  // Lab / coding
  LAB_STARTED: 'lab.started',
  LAB_SUBMITTED: 'lab.submitted',
  IDE_SESSION_STARTED: 'ide.session_started',
  IDE_SESSION_STOPPED: 'ide.session_stopped',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export interface DomainEvent<T = unknown> {
  name: EventName;
  payload: T;
  occurredAt: string;
  correlationId?: string;
  actorId?: string;
}
