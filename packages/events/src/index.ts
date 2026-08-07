/**
 * Domain event names + typed registry.
 * Prefer dotted lowercase: domain.action
 * Infrastructure only — no business handlers beyond registry.
 */

export const EVENTS = {
  COURSE_CREATED: 'course.created',
  COURSE_UPDATED: 'course.updated',
  COURSE_DELETED: 'course.deleted',
  COURSE_ARCHIVED: 'course.archived',
  COURSE_PUBLISHED: 'course.published',
  COURSE_ENROLLED: 'course.enrolled',
  ENROLLMENT_CREATED: 'enrollment.created',
  ENROLLMENT_UPDATED: 'enrollment.updated',
  ENROLLMENT_DELETED: 'enrollment.deleted',
  ENROLLMENT_APPROVED: 'enrollment.approved',
  ENROLLMENT_REJECTED: 'enrollment.rejected',
  ENROLLMENT_COMPLETED: 'enrollment.completed',
  ENROLLMENT_WITHDRAWN: 'enrollment.withdrawn',
  ENROLLMENT_IMPORTED: 'enrollment.imported',
  ENROLLMENT_EXPORTED: 'enrollment.exported',
  COURSE_MODULE_CREATED: 'module.created',
  COURSE_MODULE_UPDATED: 'module.updated',
  COURSE_MODULE_DELETED: 'module.deleted',
  COURSE_LESSON_CREATED: 'lesson.created',
  COURSE_LESSON_UPDATED: 'lesson.updated',
  COURSE_LESSON_DELETED: 'lesson.deleted',
  COURSE_RESOURCE_UPLOADED: 'resource.uploaded',
  COURSE_RESOURCE_DELETED: 'resource.deleted',
  COURSE_BUILDER_REORDERED: 'builder.reordered',
  COURSE_BUILDER_SAVED: 'builder.saved',
  COURSE_PROGRESS_UPDATED: 'course.progress.updated',
  PROGRESS_UPDATED: 'progress.updated',
  LESSON_COMPLETED: 'lesson.completed',
  MODULE_COMPLETED: 'module.completed',
  COURSE_COMPLETED: 'course.completed',
  BOOKMARK_CREATED: 'bookmark.created',
  NOTE_CREATED: 'note.created',

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

  FACULTY_CREATED: 'faculty.created',
  FACULTY_UPDATED: 'faculty.updated',
  FACULTY_DELETED: 'faculty.deleted',
  FACULTY_STATUS_CHANGED: 'faculty.status.changed',
  FACULTY_IMPORTED: 'faculty.imported',

  STUDENT_CREATED: 'student.created',
  STUDENT_UPDATED: 'student.updated',
  STUDENT_DELETED: 'student.deleted',
  STUDENT_STATUS_CHANGED: 'student.status.changed',
  STUDENT_IMPORTED: 'student.imported',
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
  'course.created': { courseId: string; institutionId: string; title?: string };
  'course.updated': { courseId: string; institutionId: string };
  'course.deleted': { courseId: string; institutionId: string };
  'course.archived': { courseId: string; institutionId: string };
  'course.published': { courseId: string; institutionId: string };
  'course.enrolled': { courseId: string; userId: string };
  'enrollment.created': {
    enrollmentId: string;
    institutionId: string;
    studentId: string;
    courseId: string;
  };
  'enrollment.updated': { enrollmentId: string; institutionId: string };
  'enrollment.deleted': { enrollmentId: string; institutionId: string };
  'enrollment.approved': {
    enrollmentId: string;
    institutionId: string;
    studentId: string;
    courseId: string;
  };
  'enrollment.rejected': { enrollmentId: string; institutionId: string };
  'enrollment.completed': {
    enrollmentId: string;
    institutionId: string;
    studentId: string;
    courseId: string;
  };
  'enrollment.withdrawn': {
    enrollmentId: string;
    institutionId: string;
    studentId: string;
    courseId: string;
  };
  'enrollment.imported': { institutionId: string; count: number };
  'enrollment.exported': { institutionId: string; format: string; count: number };
  'module.created': { courseId: string; moduleId: string; institutionId: string };
  'module.updated': { courseId: string; moduleId: string; institutionId: string };
  'module.deleted': { courseId: string; moduleId: string; institutionId: string };
  'lesson.created': {
    courseId: string;
    moduleId: string;
    lessonId: string;
    institutionId: string;
  };
  'lesson.updated': {
    courseId: string;
    moduleId: string;
    lessonId: string;
    institutionId: string;
  };
  'lesson.deleted': {
    courseId: string;
    moduleId: string;
    lessonId: string;
    institutionId: string;
  };
  'resource.uploaded': {
    courseId: string;
    lessonId: string;
    resourceId: string;
    institutionId: string;
  };
  'resource.deleted': {
    courseId: string;
    lessonId: string;
    resourceId: string;
    institutionId: string;
  };
  'builder.reordered': { courseId: string; institutionId: string };
  'builder.saved': { courseId: string; lessonId?: string; institutionId: string };
  'course.progress.updated': { courseId: string; studentId: string; progressPercent: number };
  'progress.updated': {
    courseId: string;
    studentId: string;
    institutionId: string;
    progressPercentage: number;
  };
  'lesson.completed': {
    courseId: string;
    moduleId: string;
    lessonId: string;
    studentId: string;
    institutionId: string;
  };
  'module.completed': {
    courseId: string;
    moduleId: string;
    studentId: string;
    institutionId: string;
  };
  'course.completed': {
    courseId: string;
    studentId: string;
    institutionId: string;
    enrollmentId: string;
  };
  'bookmark.created': {
    bookmarkId: string;
    studentId: string;
    courseId: string;
    institutionId: string;
  };
  'note.created': {
    noteId: string;
    studentId: string;
    courseId: string;
    lessonId: string;
    institutionId: string;
  };
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
  'faculty.created': { facultyId: string; institutionId: string };
  'faculty.updated': { facultyId: string; institutionId: string };
  'faculty.deleted': { facultyId: string; institutionId: string };
  'faculty.status.changed': {
    facultyId: string;
    institutionId: string;
    status: string;
  };
  'faculty.imported': { institutionId: string; count: number };
  'student.created': { studentId: string; institutionId: string };
  'student.updated': { studentId: string; institutionId: string };
  'student.deleted': { studentId: string; institutionId: string };
  'student.status.changed': {
    studentId: string;
    institutionId: string;
    status: string;
  };
  'student.imported': { institutionId: string; count: number };
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
  { name: EVENTS.COURSE_UPDATED, description: 'Course updated', version: 1 },
  { name: EVENTS.COURSE_DELETED, description: 'Course soft-deleted', version: 1 },
  { name: EVENTS.COURSE_ARCHIVED, description: 'Course archived', version: 1 },
  { name: EVENTS.COURSE_PUBLISHED, description: 'Course published', version: 1 },
  { name: EVENTS.COURSE_ENROLLED, description: 'Course enrolled', version: 1 },
  { name: EVENTS.ENROLLMENT_CREATED, description: 'Enrollment created', version: 1 },
  { name: EVENTS.ENROLLMENT_UPDATED, description: 'Enrollment updated', version: 1 },
  { name: EVENTS.ENROLLMENT_DELETED, description: 'Enrollment deleted', version: 1 },
  { name: EVENTS.ENROLLMENT_APPROVED, description: 'Enrollment approved', version: 1 },
  { name: EVENTS.ENROLLMENT_REJECTED, description: 'Enrollment rejected', version: 1 },
  { name: EVENTS.ENROLLMENT_COMPLETED, description: 'Enrollment completed', version: 1 },
  { name: EVENTS.ENROLLMENT_WITHDRAWN, description: 'Enrollment withdrawn', version: 1 },
  { name: EVENTS.ENROLLMENT_IMPORTED, description: 'Enrollment CSV import completed', version: 1 },
  { name: EVENTS.ENROLLMENT_EXPORTED, description: 'Enrollment export completed', version: 1 },
  { name: EVENTS.COURSE_MODULE_CREATED, description: 'Course module created', version: 1 },
  { name: EVENTS.COURSE_MODULE_UPDATED, description: 'Course module updated', version: 1 },
  { name: EVENTS.COURSE_MODULE_DELETED, description: 'Course module deleted', version: 1 },
  { name: EVENTS.COURSE_LESSON_CREATED, description: 'Course lesson created', version: 1 },
  { name: EVENTS.COURSE_LESSON_UPDATED, description: 'Course lesson updated', version: 1 },
  { name: EVENTS.COURSE_LESSON_DELETED, description: 'Course lesson deleted', version: 1 },
  { name: EVENTS.COURSE_RESOURCE_UPLOADED, description: 'Course resource uploaded', version: 1 },
  { name: EVENTS.COURSE_RESOURCE_DELETED, description: 'Course resource deleted', version: 1 },
  { name: EVENTS.COURSE_BUILDER_REORDERED, description: 'Course builder reordered', version: 1 },
  { name: EVENTS.COURSE_BUILDER_SAVED, description: 'Course builder saved', version: 1 },
  { name: EVENTS.COURSE_PROGRESS_UPDATED, description: 'Course progress updated', version: 1 },
  { name: EVENTS.PROGRESS_UPDATED, description: 'Learning progress updated', version: 1 },
  { name: EVENTS.LESSON_COMPLETED, description: 'Lesson completed by learner', version: 1 },
  { name: EVENTS.MODULE_COMPLETED, description: 'Module completed by learner', version: 1 },
  { name: EVENTS.COURSE_COMPLETED, description: 'Course learning completed', version: 1 },
  { name: EVENTS.BOOKMARK_CREATED, description: 'Learning bookmark created', version: 1 },
  { name: EVENTS.NOTE_CREATED, description: 'Learning note created', version: 1 },
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
  { name: EVENTS.FACULTY_CREATED, description: 'Faculty member created', version: 1 },
  { name: EVENTS.FACULTY_UPDATED, description: 'Faculty member updated', version: 1 },
  { name: EVENTS.FACULTY_DELETED, description: 'Faculty member deleted', version: 1 },
  { name: EVENTS.FACULTY_STATUS_CHANGED, description: 'Faculty status changed', version: 1 },
  { name: EVENTS.FACULTY_IMPORTED, description: 'Faculty CSV import completed', version: 1 },
  { name: EVENTS.STUDENT_CREATED, description: 'Student created', version: 1 },
  { name: EVENTS.STUDENT_UPDATED, description: 'Student updated', version: 1 },
  { name: EVENTS.STUDENT_DELETED, description: 'Student deleted', version: 1 },
  { name: EVENTS.STUDENT_STATUS_CHANGED, description: 'Student status changed', version: 1 },
  { name: EVENTS.STUDENT_IMPORTED, description: 'Student CSV import completed', version: 1 },
] as const;

export function isRegisteredEvent(name: string): name is EventName {
  return EVENT_REGISTRY.some((e) => e.name === name);
}

export function getEventDefinition(name: EventName): EventDefinition | undefined {
  return EVENT_REGISTRY.find((e) => e.name === name);
}
