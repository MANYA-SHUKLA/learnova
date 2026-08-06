/**
 * Domain event names + typed registry.
 * Prefer dotted lowercase: domain.action
 * Infrastructure only — no business handlers beyond registry.
 */

export const EVENTS = {
  COURSE_CREATED: 'course.created',
  COURSE_UPDATED: 'course.updated',
  COURSE_ARCHIVED: 'course.archived',
  COURSE_ENROLLED: 'course.enrolled',

  USER_CREATED: 'user.created',
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',

  EXAM_CREATED: 'exam.created',
  EXAM_STARTED: 'exam.started',
  EXAM_COMPLETED: 'exam.completed',
  EXAM_CANCELLED: 'exam.cancelled',

  PROJECT_CREATED: 'project.created',
  PROJECT_SUBMITTED: 'project.submitted',
  PROJECT_GRADED: 'project.graded',

  CERTIFICATE_GENERATED: 'certificate.generated',
  CERTIFICATE_REVOKED: 'certificate.revoked',

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

/** Typed payload map — expand when domain modules land */
export interface EventPayloadMap {
  'course.created': { courseId: string; title?: string };
  'course.updated': { courseId: string };
  'course.archived': { courseId: string };
  'course.enrolled': { courseId: string; userId: string };
  'user.created': { userId: string; email?: string };
  'user.registered': { userId: string };
  'user.logged_in': { userId: string };
  'user.logged_out': { userId: string };
  'exam.created': { examId: string };
  'exam.started': { examId: string; userId?: string };
  'exam.completed': { examId: string; userId?: string };
  'exam.cancelled': { examId: string };
  'project.created': { projectId: string };
  'project.submitted': { projectId: string; userId?: string };
  'project.graded': { projectId: string };
  'certificate.generated': { certificateId: string; userId?: string };
  'certificate.revoked': { certificateId: string };
  'lab.started': { labId: string; userId?: string };
  'lab.submitted': { labId: string; userId?: string };
  'ide.session_started': { sessionId: string; userId?: string };
  'ide.session_stopped': { sessionId: string };
}

export type TypedEventName = keyof EventPayloadMap;

export interface EventDefinition {
  name: EventName;
  description: string;
  version: number;
}

/** Event registry — discoverable catalog for tooling & docs */
export const EVENT_REGISTRY: readonly EventDefinition[] = [
  { name: EVENTS.COURSE_CREATED, description: 'Course created', version: 1 },
  { name: EVENTS.USER_CREATED, description: 'User created', version: 1 },
  { name: EVENTS.EXAM_COMPLETED, description: 'Exam completed', version: 1 },
  { name: EVENTS.CERTIFICATE_GENERATED, description: 'Certificate generated', version: 1 },
  { name: EVENTS.PROJECT_SUBMITTED, description: 'Project submitted', version: 1 },
  { name: EVENTS.COURSE_UPDATED, description: 'Course updated', version: 1 },
  { name: EVENTS.COURSE_ARCHIVED, description: 'Course archived', version: 1 },
  { name: EVENTS.COURSE_ENROLLED, description: 'Course enrolled', version: 1 },
  { name: EVENTS.EXAM_CREATED, description: 'Exam created', version: 1 },
  { name: EVENTS.EXAM_STARTED, description: 'Exam started', version: 1 },
  { name: EVENTS.EXAM_CANCELLED, description: 'Exam cancelled', version: 1 },
  { name: EVENTS.PROJECT_CREATED, description: 'Project created', version: 1 },
  { name: EVENTS.PROJECT_GRADED, description: 'Project graded', version: 1 },
  { name: EVENTS.CERTIFICATE_REVOKED, description: 'Certificate revoked', version: 1 },
  { name: EVENTS.USER_REGISTERED, description: 'User registered', version: 1 },
  { name: EVENTS.USER_LOGGED_IN, description: 'User logged in', version: 1 },
  { name: EVENTS.USER_LOGGED_OUT, description: 'User logged out', version: 1 },
  { name: EVENTS.LAB_STARTED, description: 'Lab started', version: 1 },
  { name: EVENTS.LAB_SUBMITTED, description: 'Lab submitted', version: 1 },
  { name: EVENTS.IDE_SESSION_STARTED, description: 'IDE session started', version: 1 },
  { name: EVENTS.IDE_SESSION_STOPPED, description: 'IDE session stopped', version: 1 },
] as const;

export function isRegisteredEvent(name: string): name is EventName {
  return EVENT_REGISTRY.some((e) => e.name === name);
}

export function getEventDefinition(name: EventName): EventDefinition | undefined {
  return EVENT_REGISTRY.find((e) => e.name === name);
}
