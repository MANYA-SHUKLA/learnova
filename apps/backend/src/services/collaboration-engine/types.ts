import type { ID } from '@learnova/types';

/**
 * Collaboration Engine — independent academic project collaboration system.
 *
 * Step 11 (Project Management) consumes this engine.
 * Gradebook (Step 13) and Learning Progress bridges read exported data — they do not
 * duplicate team, milestone, submission, review, or comment logic here.
 */

export type CollaborationActivityKind = 'project';

export interface CollaborationActivityRef {
  kind: CollaborationActivityKind;
  activityId: ID;
  courseId: ID;
  institutionId: ID;
}

/** Course integration — every project belongs to a course */
export interface CollaborationCourseContext {
  institutionId: ID;
  courseId: ID;
  moduleId: ID | null;
  lessonId: ID | null;
}

/** Student integration — individuals or team members */
export interface CollaborationStudentContext {
  studentId: ID;
  userId: ID;
  email: string;
}

/** Faculty integration — supervision and reviews (not grading) */
export interface CollaborationFacultyContext {
  facultyId: ID;
  userId: ID;
  email: string;
  supervisedCourseIds: ID[];
}

/**
 * Enrollment gate — projects are visible only to enrolled learners.
 * Implemented via Enrollment model lookups (no duplicate enrollment logic).
 */
export interface CollaborationEnrollmentGate {
  assertEnrolled(input: {
    institutionId: ID;
    studentId: ID;
    courseId: ID;
  }): Promise<void>;
  listEnrolledCourseIds(input: {
    institutionId: ID;
    studentId: ID;
  }): Promise<ID[]>;
}

/**
 * Future: optional Assignment linkage (Step 9 consumer).
 * Project module stores `linkedAssignmentId` only — no assignment logic duplicated.
 */
export interface CollaborationAssignmentLink {
  linkedAssignmentId: ID | null;
}

/**
 * Future: Learning Progress bridge (Step 8.5).
 * Milestone completion may contribute to course progress in a later integration step.
 */
export interface CollaborationProgressBridge {
  onMilestoneCompleted?(payload: {
    institutionId: ID;
    courseId: ID;
    studentId: ID;
    projectId: ID;
    milestoneId: ID;
  }): Promise<void>;
}

/**
 * Future: Gradebook bridge (Step 13).
 * Gradebook consumes submissions with evaluationStatus=ready — no marks computed here.
 */
export interface CollaborationGradebookExportRecord {
  submissionId: ID;
  projectId: ID;
  courseId: ID;
  studentId: ID | null;
  teamId: ID | null;
  evaluationReadyAt: string;
  evaluationReadyBy: ID | null;
  /** Faculty reviews + submission artifacts for gradebook scoring */
  reviewIds: ID[];
  attachmentIds: ID[];
}

export interface CollaborationGradebookBridge {
  listEvaluationReady(input: {
    institutionId: ID;
    courseId?: ID;
    projectId?: ID;
  }): Promise<CollaborationGradebookExportRecord[]>;
}

/** Evaluation lifecycle on submissions — distinct from Gradebook marks */
export type CollaborationEvaluationStatus = 'pending' | 'ready' | 'exported';

export interface CollaborationEvaluationReadyInput {
  submissionId: ID;
  notes: string | null;
  returnToStudent: boolean;
}

export interface CollaborationEvaluationReadyResult {
  submissionId: ID;
  evaluationStatus: CollaborationEvaluationStatus;
  evaluationReadyAt: string;
}
