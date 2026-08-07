import type { ID } from '../common/index.js';

/**
 * Assessment Core — shared contracts for Assignments, Labs, Quizzes, Exams.
 * Module-specific types (e.g. Assignment) extend or compose these primitives.
 */

/** Product surface that participates in the assessment platform */
export type AssessmentKind =
  | 'assignment'
  | 'lab'
  | 'quiz'
  | 'exam'
  | 'project';

/** Shared publish lifecycle for assessable activities */
export type AssessmentLifecycleStatus = 'draft' | 'published' | 'archived' | 'closed';

export type AssessmentVisibility = 'institution' | 'enrolled' | 'faculty';

/** Shared learner attempt / delivery status */
export type AssessmentAttemptStatus =
  | 'draft'
  | 'submitted'
  | 'late'
  | 'returned'
  | 'graded'
  | 'missing';

export type AssessmentDeliveryType = 'text' | 'file' | 'link' | 'mixed' | 'code' | 'interactive';

export type AssessmentGradingMethod =
  | 'manual'
  | 'rubric'
  | 'pass_fail'
  | 'marks'
  | 'percentage'
  | 'auto';

export interface AssessmentFileRef {
  id: ID;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  url: string | null;
  uploadedBy: ID | null;
  createdAt: string;
}

export interface AssessmentDeadlinePolicy {
  publishDate: string | null;
  dueDate: string | null;
  closeDate: string | null;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
}

export interface AssessmentAttemptPolicy {
  allowResubmission: boolean;
  maxAttempts: number;
}

export interface AssessmentMarksPolicy {
  totalMarks: number;
  passingMarks: number;
  weightage: number;
}

export interface AssessmentRubricCriterion {
  id: ID;
  title: string;
  description: string | null;
  weight: number;
  maxPoints: number;
}

export interface AssessmentRubricScore {
  criterionId: ID;
  points: number;
  comment: string | null;
}

export interface AssessmentGradeResult {
  gradingMethod: AssessmentGradingMethod;
  marksObtained: number | null;
  percentage: number | null;
  passed: boolean | null;
  feedback: string | null;
  rubricScores: AssessmentRubricScore[];
  gradedBy: ID | null;
  gradedAt: string | null;
}

export interface AssessmentFeedbackItem {
  id: ID;
  parentId: ID | null;
  authorId: ID;
  authorRole: string;
  body: string;
  attachments: AssessmentFileRef[];
  createdAt: string;
  updatedAt: string;
}

/** Common fields every assessable activity should expose */
export interface AssessmentActivityBase
  extends AssessmentDeadlinePolicy,
    AssessmentAttemptPolicy,
    AssessmentMarksPolicy {
  id: ID;
  institutionId: ID;
  courseId: ID;
  kind: AssessmentKind;
  title: string;
  description: string | null;
  instructions: string | null;
  visibility: AssessmentVisibility;
  status: AssessmentLifecycleStatus;
  estimatedMinutes: number | null;
  rubricId: ID | null;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AssessmentSubmissionBase {
  id: ID;
  institutionId: ID;
  activityId: ID;
  activityKind: AssessmentKind;
  courseId: ID;
  studentId: ID;
  attemptNumber: number;
  submittedAt: string | null;
  status: AssessmentAttemptStatus;
  deliveryType: AssessmentDeliveryType;
  files: AssessmentFileRef[];
  textSubmission: string | null;
  links: string[];
  timeSpentMinutes: number | null;
  lateSubmission: boolean;
  gradeId: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Canonical audit event suffixes — modules prefix with their domain */
export type AssessmentAuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'published'
  | 'archived'
  | 'closed'
  | 'submitted'
  | 'graded'
  | 'feedback_added'
  | 'attachment_uploaded'
  | 'attempt_started'
  | 'attempt_expired';

export interface AssessmentAuditEventName {
  kind: AssessmentKind;
  action: AssessmentAuditAction;
}

export function assessmentAuditEventName(
  kind: AssessmentKind,
  action: AssessmentAuditAction,
): string {
  if (action === 'submitted' || action === 'graded') {
    return `submission.${action === 'submitted' ? 'created' : 'graded'}`;
  }
  if (action === 'feedback_added') return 'feedback.added';
  if (action === 'attachment_uploaded') return `${kind}.attachment_uploaded`;
  return `${kind}.${action}`;
}
