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

  ASSIGNMENT_CREATED: 'assignment.created',
  ASSIGNMENT_UPDATED: 'assignment.updated',
  ASSIGNMENT_DELETED: 'assignment.deleted',
  ASSIGNMENT_PUBLISHED: 'assignment.published',
  SUBMISSION_CREATED: 'submission.created',
  SUBMISSION_GRADED: 'submission.graded',
  FEEDBACK_ADDED: 'feedback.added',

  USER_CREATED: 'user.created',
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',

  EXAM_CREATED: 'exam.created',
  EXAM_STARTED: 'exam.started',
  EXAM_COMPLETED: 'exam.completed',
  EXAM_CANCELLED: 'exam.cancelled',
  EXAM_SCHEDULED: 'exam.scheduled',
  EXAM_PUBLISHED: 'exam.published',
  EXAM_CHECKED_IN: 'exam.checked_in',
  EXAM_PROCTOR_FLAGGED: 'exam.proctor.flagged',
  EXAM_PROCTOR_TERMINATED: 'exam.proctor.terminated',
  EXAM_SUBMITTED: 'exam.submitted',
  EXAM_FINISHED: 'exam.finished',
  VIOLATION_RECORDED: 'violation.recorded',
  VIOLATION_DETECTED: 'violation.detected',

  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_PUBLISHED: 'project.published',
  PROJECT_ARCHIVED: 'project.archived',
  PROJECT_DELETED: 'project.deleted',
  PROJECT_SUBMITTED: 'project.submitted',
  PROJECT_EVALUATION_READY: 'project.evaluation.ready',
  PROJECT_GRADED: 'project.graded',
  PROJECT_TEAM_CREATED: 'project.team.created',
  PROJECT_TEAM_JOINED: 'project.team.joined',
  PROJECT_TEAM_APPROVED: 'project.team.approved',
  PROJECT_TEAM_REJECTED: 'project.team.rejected',
  PROJECT_MILESTONE_COMPLETED: 'project.milestone.completed',
  PROJECT_REVIEW_SUBMITTED: 'project.review.submitted',
  PROJECT_REVIEW_CREATED: 'project.review.created',
  PROJECT_COMMENT_CREATED: 'project.comment.created',
  PROJECT_SUBMISSION_CREATED: 'project.submission.created',

  CERTIFICATE_GENERATED: 'certificate.generated',
  CERTIFICATE_REVOKED: 'certificate.revoked',

  LAB_STARTED: 'lab.started',
  LAB_SUBMITTED: 'lab.submitted',
  LAB_COMPLETED: 'lab.completed',
  PRACTICE_CREATED: 'practice.created',
  PROBLEM_CREATED: 'problem.created',
  PROBLEM_SOLVED: 'problem.solved',
  LAB_SUBMISSION_CREATED: 'lab.submission.created',
  LAB_SUBMISSION_ACCEPTED: 'lab.submission.accepted',
  LAB_SUBMISSION_FAILED: 'lab.submission.failed',
  EXECUTION_STARTED: 'execution.started',
  EXECUTION_FINISHED: 'execution.finished',
  EXECUTION_COMPLETED: 'execution.completed',
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

  QUIZ_CREATED: 'quiz.created',
  QUIZ_UPDATED: 'quiz.updated',
  QUIZ_DELETED: 'quiz.deleted',
  QUIZ_PUBLISHED: 'quiz.published',
  QUIZ_STARTED: 'quiz.started',
  QUIZ_COMPLETED: 'quiz.completed',
  QUESTION_CREATED: 'question.created',
  QUESTION_UPDATED: 'question.updated',
  ATTEMPT_CREATED: 'attempt.created',
  ATTEMPT_STARTED: 'attempt.started',
  ATTEMPT_SUBMITTED: 'attempt.submitted',
  QUESTION_ANSWERED: 'question.answered',

  GRADE_READY: 'grade.ready',
  GRADE_PUBLISHED: 'grade.published',
  GRADE_LOCKED: 'grade.locked',
  GRADE_CALCULATED: 'grade.calculated',
  GRADE_APPEAL_CREATED: 'grade.appeal.created',
  GRADE_APPEAL_RESOLVED: 'grade.appeal.resolved',
  GRADE_MODERATION_SUBMITTED: 'grade.moderation.submitted',
  GRADE_MODERATION_DEPARTMENT_APPROVED: 'grade.moderation.department_approved',
  GRADE_MODERATION_PUBLISHED: 'grade.moderation.published',
  GRADE_SNAPSHOT_CREATED: 'grade.snapshot.created',
  GRADE_STANDING_COMPUTED: 'grade.standing.computed',

  CERTIFICATE_READY: 'certificate.ready',
  CERTIFICATE_ISSUED: 'certificate.issued',
  CERTIFICATE_PUBLISHED: 'certificate.published',
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
  'assignment.created': {
    assignmentId: string;
    courseId: string;
    institutionId: string;
  };
  'assignment.updated': {
    assignmentId: string;
    courseId: string;
    institutionId: string;
  };
  'assignment.deleted': {
    assignmentId: string;
    courseId: string;
    institutionId: string;
  };
  'assignment.published': {
    assignmentId: string;
    courseId: string;
    institutionId: string;
  };
  'submission.created': {
    submissionId: string;
    assignmentId: string;
    studentId: string;
    institutionId: string;
  };
  'submission.graded': {
    submissionId: string;
    assignmentId: string;
    studentId: string;
    institutionId: string;
    gradeId: string;
  };
  'feedback.added': {
    commentId: string;
    assignmentId: string;
    submissionId: string | null;
    institutionId: string;
  };
  'user.created': { userId: string; email?: string };
  'user.registered': { userId: string };
  'user.logged_in': { userId: string };
  'user.logged_out': { userId: string };
  'exam.created': { examId: string; institutionId?: string };
  'exam.started': { examId: string; userId?: string; attemptId?: string };
  'exam.completed': { examId: string; userId?: string; attemptId?: string };
  'exam.cancelled': { examId: string; institutionId?: string };
  'exam.scheduled': { examId: string; institutionId?: string; scheduledAt?: string };
  'exam.published': { examId: string; institutionId?: string };
  'exam.checked_in': { examId: string; userId: string; seatingId?: string };
  'exam.proctor.flagged': { examId: string; attemptId: string; proctorId?: string; reason?: string };
  'exam.proctor.terminated': { examId: string; attemptId: string; proctorId?: string; reason?: string };
  'exam.submitted': { examId: string; attemptId: string; userId?: string; institutionId?: string };
  'exam.finished': { examId: string; attemptId: string; userId?: string; institutionId?: string };
  'violation.recorded': {
    examId: string;
    attemptId: string;
    violationType: string;
    severity?: string;
    institutionId?: string;
  };
  'violation.detected': {
    examId: string;
    attemptId: string;
    violationType: string;
    autoAction?: string;
    institutionId?: string;
  };
  'project.created': { projectId: string; courseId: string; institutionId: string };
  'project.updated': { projectId: string; courseId: string; institutionId: string };
  'project.published': { projectId: string; courseId: string; institutionId: string };
  'project.archived': { projectId: string; courseId: string; institutionId: string };
  'project.deleted': { projectId: string; courseId: string; institutionId: string };
  'project.submitted': { projectId: string; userId?: string };
  'project.evaluation.ready': {
    projectId: string;
    submissionId: string;
    institutionId: string;
    courseId: string;
  };
  'project.graded': { projectId: string; gradeId: string; institutionId: string };
  'project.team.created': {
    teamId: string;
    projectId: string;
    courseId: string;
    institutionId: string;
  };
  'project.team.joined': {
    teamId: string;
    projectId: string;
    studentId: string;
    institutionId: string;
  };
  'project.team.approved': {
    teamId: string;
    projectId: string;
    institutionId: string;
    approvedBy: string;
  };
  'project.team.rejected': {
    teamId: string;
    projectId: string;
    institutionId: string;
    rejectedBy: string;
    reason?: string;
  };
  'project.milestone.completed': {
    milestoneId: string;
    projectId: string;
    institutionId: string;
    studentId?: string;
    teamId?: string;
  };
  'project.review.submitted': {
    reviewId: string;
    projectId: string;
    submissionId: string;
    reviewerId: string;
    institutionId: string;
  };
  'project.review.created': {
    reviewId: string;
    projectId: string;
    submissionId: string;
    reviewerId: string;
    institutionId: string;
    reviewType: string;
  };
  'project.comment.created': {
    commentId: string;
    projectId: string;
    institutionId: string;
    authorId: string;
    submissionId?: string;
    parentCommentId?: string;
  };
  'project.submission.created': {
    submissionId: string;
    projectId: string;
    studentId: string;
    institutionId: string;
    teamId?: string;
    milestoneId?: string;
  };
  'certificate.generated': { certificateId: string; userId?: string };
  'certificate.revoked': { certificateId: string };
  'lab.started': { labId: string; userId?: string };
  'lab.submitted': { labId: string; userId?: string };
  'lab.completed': {
    labId: string;
    studentId: string;
    institutionId: string;
  };
  'practice.created': {
    practiceLabId: string;
    courseId: string;
    institutionId: string;
  };
  'problem.created': {
    problemId: string;
    practiceLabId: string;
    institutionId: string;
  };
  'problem.solved': {
    problemId: string;
    practiceLabId: string;
    studentId: string;
    institutionId: string;
    submissionId: string;
  };
  'lab.submission.created': {
    submissionId: string;
    problemId: string;
    practiceLabId: string;
    studentId: string;
    institutionId: string;
  };
  'lab.submission.accepted': {
    submissionId: string;
    problemId: string;
    practiceLabId: string;
    studentId: string;
    institutionId: string;
  };
  'lab.submission.failed': {
    submissionId: string;
    problemId: string;
    practiceLabId: string;
    studentId: string;
    institutionId: string;
    verdict: string;
  };
  'execution.started': {
    executionId: string;
    studentId: string;
    institutionId: string;
  };
  'execution.finished': {
    executionId: string;
    studentId: string;
    institutionId: string;
    status: string;
  };
  'execution.completed': {
    executionId: string;
    studentId: string;
    institutionId: string;
    status: string;
  };
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
  'quiz.created': { quizId: string; institutionId: string; courseId: string };
  'quiz.updated': { quizId: string; institutionId: string };
  'quiz.deleted': { quizId: string; institutionId: string };
  'quiz.published': { quizId: string; institutionId: string; courseId: string };
  'quiz.started': { quizId: string; studentId: string; attemptId: string };
  'quiz.completed': { quizId: string; studentId: string; attemptId: string; score: number };
  'question.created': { questionId: string; institutionId: string; questionBankId: string };
  'question.updated': { questionId: string; institutionId: string };
  'attempt.created': { attemptId: string; quizId: string; studentId: string; institutionId: string };
  'attempt.started': { attemptId: string; quizId: string; studentId: string; institutionId: string };
  'attempt.submitted': {
    attemptId: string;
    quizId: string;
    studentId: string;
    institutionId: string;
    score: number;
  };
  'question.answered': {
    attemptId: string;
    questionId: string;
    isCorrect: boolean | null;
  };
  'grade.ready': { courseId: string; studentId: string; institutionId: string };
  'grade.published': { courseId: string; institutionId: string; count: number };
  'grade.locked': { courseId: string; institutionId: string; count: number };
  'grade.calculated': { courseId: string; studentId: string; institutionId: string };
  'grade.appeal.created': { appealId: string; courseGradeId: string; studentId: string };
  'grade.appeal.resolved': { appealId: string; status: string; studentId: string };
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
  { name: EVENTS.ASSIGNMENT_CREATED, description: 'Assignment created', version: 1 },
  { name: EVENTS.ASSIGNMENT_UPDATED, description: 'Assignment updated', version: 1 },
  { name: EVENTS.ASSIGNMENT_DELETED, description: 'Assignment deleted', version: 1 },
  { name: EVENTS.ASSIGNMENT_PUBLISHED, description: 'Assignment published', version: 1 },
  { name: EVENTS.SUBMISSION_CREATED, description: 'Assignment submission created', version: 1 },
  { name: EVENTS.SUBMISSION_GRADED, description: 'Assignment submission graded', version: 1 },
  { name: EVENTS.FEEDBACK_ADDED, description: 'Assignment feedback/comment added', version: 1 },
  { name: EVENTS.USER_CREATED, description: 'User created', version: 1 },
  { name: EVENTS.EXAM_CREATED, description: 'Exam created', version: 1 },
  { name: EVENTS.EXAM_STARTED, description: 'Exam started', version: 1 },
  { name: EVENTS.EXAM_COMPLETED, description: 'Exam completed', version: 1 },
  { name: EVENTS.EXAM_CANCELLED, description: 'Exam cancelled', version: 1 },
  { name: EVENTS.EXAM_SCHEDULED, description: 'Exam scheduled', version: 1 },
  { name: EVENTS.EXAM_PUBLISHED, description: 'Exam published', version: 1 },
  { name: EVENTS.EXAM_CHECKED_IN, description: 'Student checked in for exam', version: 1 },
  { name: EVENTS.EXAM_PROCTOR_FLAGGED, description: 'Proctor flagged exam attempt', version: 1 },
  { name: EVENTS.EXAM_PROCTOR_TERMINATED, description: 'Proctor terminated exam attempt', version: 1 },
  { name: EVENTS.EXAM_SUBMITTED, description: 'Exam attempt submitted', version: 1 },
  { name: EVENTS.EXAM_FINISHED, description: 'Exam attempt finished', version: 1 },
  { name: EVENTS.VIOLATION_RECORDED, description: 'Exam violation recorded', version: 1 },
  { name: EVENTS.VIOLATION_DETECTED, description: 'Exam violation detected', version: 1 },
  { name: EVENTS.CERTIFICATE_GENERATED, description: 'Certificate generated', version: 1 },
  { name: EVENTS.CERTIFICATE_READY, description: 'Certificate ready for issue', version: 1 },
  { name: EVENTS.CERTIFICATE_ISSUED, description: 'Certificate issued to student', version: 1 },
  { name: EVENTS.CERTIFICATE_PUBLISHED, description: 'Certificate published to student portal', version: 1 },
  { name: EVENTS.PROJECT_SUBMITTED, description: 'Project submitted', version: 1 },
  { name: EVENTS.PROJECT_CREATED, description: 'Project created', version: 1 },
  { name: EVENTS.PROJECT_UPDATED, description: 'Project updated', version: 1 },
  { name: EVENTS.PROJECT_PUBLISHED, description: 'Project published', version: 1 },
  { name: EVENTS.PROJECT_ARCHIVED, description: 'Project archived', version: 1 },
  { name: EVENTS.PROJECT_DELETED, description: 'Project deleted', version: 1 },
  { name: EVENTS.PROJECT_GRADED, description: 'Project graded', version: 1 },
  { name: EVENTS.PROJECT_TEAM_CREATED, description: 'Project team created', version: 1 },
  { name: EVENTS.PROJECT_TEAM_JOINED, description: 'Student joined project team', version: 1 },
  { name: EVENTS.PROJECT_TEAM_APPROVED, description: 'Project team approved by faculty', version: 1 },
  { name: EVENTS.PROJECT_TEAM_REJECTED, description: 'Project team rejected by faculty', version: 1 },
  { name: EVENTS.PROJECT_MILESTONE_COMPLETED, description: 'Project milestone completed', version: 1 },
  { name: EVENTS.PROJECT_REVIEW_SUBMITTED, description: 'Project review submitted', version: 1 },
  { name: EVENTS.PROJECT_REVIEW_CREATED, description: 'Project review created', version: 1 },
  { name: EVENTS.PROJECT_COMMENT_CREATED, description: 'Project comment created', version: 1 },
  { name: EVENTS.PROJECT_SUBMISSION_CREATED, description: 'Project submission created', version: 1 },
  { name: EVENTS.CERTIFICATE_REVOKED, description: 'Certificate revoked', version: 1 },
  { name: EVENTS.USER_REGISTERED, description: 'User registered', version: 1 },
  { name: EVENTS.USER_LOGGED_IN, description: 'User logged in', version: 1 },
  { name: EVENTS.USER_LOGGED_OUT, description: 'User logged out', version: 1 },
  { name: EVENTS.LAB_STARTED, description: 'Lab started', version: 1 },
  { name: EVENTS.LAB_SUBMITTED, description: 'Lab submitted', version: 1 },
  { name: EVENTS.LAB_COMPLETED, description: 'Practice lab completed by learner', version: 1 },
  { name: EVENTS.PRACTICE_CREATED, description: 'Practice lab created', version: 1 },
  { name: EVENTS.PROBLEM_CREATED, description: 'Lab problem created', version: 1 },
  { name: EVENTS.PROBLEM_SOLVED, description: 'Lab problem solved', version: 1 },
  { name: EVENTS.LAB_SUBMISSION_CREATED, description: 'Lab submission created', version: 1 },
  { name: EVENTS.LAB_SUBMISSION_ACCEPTED, description: 'Lab submission accepted', version: 1 },
  { name: EVENTS.LAB_SUBMISSION_FAILED, description: 'Lab submission failed', version: 1 },
  { name: EVENTS.EXECUTION_STARTED, description: 'Code execution started', version: 1 },
  { name: EVENTS.EXECUTION_FINISHED, description: 'Code execution finished', version: 1 },
  { name: EVENTS.EXECUTION_COMPLETED, description: 'Code execution completed', version: 1 },
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
  { name: EVENTS.QUIZ_CREATED, description: 'Quiz created', version: 1 },
  { name: EVENTS.QUIZ_UPDATED, description: 'Quiz updated', version: 1 },
  { name: EVENTS.QUIZ_DELETED, description: 'Quiz deleted', version: 1 },
  { name: EVENTS.QUIZ_PUBLISHED, description: 'Quiz published', version: 1 },
  { name: EVENTS.QUIZ_STARTED, description: 'Quiz attempt started by student', version: 1 },
  { name: EVENTS.QUIZ_COMPLETED, description: 'Quiz attempt completed', version: 1 },
  { name: EVENTS.QUESTION_CREATED, description: 'Question bank question created', version: 1 },
  { name: EVENTS.QUESTION_UPDATED, description: 'Question bank question updated', version: 1 },
  { name: EVENTS.ATTEMPT_CREATED, description: 'Quiz attempt record created', version: 1 },
  { name: EVENTS.ATTEMPT_STARTED, description: 'Quiz attempt started', version: 1 },
  { name: EVENTS.ATTEMPT_SUBMITTED, description: 'Quiz attempt submitted', version: 1 },
  { name: EVENTS.QUESTION_ANSWERED, description: 'Quiz question answered during attempt', version: 1 },
  { name: EVENTS.GRADE_READY, description: 'Course grade computed and ready for review', version: 1 },
  { name: EVENTS.GRADE_PUBLISHED, description: 'Course grades published to students', version: 1 },
  { name: EVENTS.GRADE_LOCKED, description: 'Course grades locked', version: 1 },
  { name: EVENTS.GRADE_CALCULATED, description: 'Course grade recalculated from sources', version: 1 },
  { name: EVENTS.GRADE_APPEAL_CREATED, description: 'Student grade appeal submitted', version: 1 },
  { name: EVENTS.GRADE_APPEAL_RESOLVED, description: 'Grade appeal resolved by faculty', version: 1 },
  { name: EVENTS.GRADE_MODERATION_SUBMITTED, description: 'Faculty submitted grades for department review', version: 1 },
  { name: EVENTS.GRADE_MODERATION_DEPARTMENT_APPROVED, description: 'Department approved moderated grades', version: 1 },
  { name: EVENTS.GRADE_MODERATION_PUBLISHED, description: 'Institution published moderated grades', version: 1 },
  { name: EVENTS.GRADE_SNAPSHOT_CREATED, description: 'Immutable gradebook snapshot version created', version: 1 },
  { name: EVENTS.GRADE_STANDING_COMPUTED, description: 'Academic standing computed for students', version: 1 },
] as const;

export function isRegisteredEvent(name: string): name is EventName {
  return EVENT_REGISTRY.some((e) => e.name === name);
}

export function getEventDefinition(name: EventName): EventDefinition | undefined {
  return EVENT_REGISTRY.find((e) => e.name === name);
}
