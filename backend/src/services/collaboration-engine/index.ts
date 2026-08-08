/**
 * Collaboration Engine
 *
 * Independent collaboration infrastructure for Project Management (Step 11).
 * Integrates with Courses, Students, and Faculty. Gradebook and Learning Progress
 * consume exported data in later steps — do not implement grading here.
 */

export {
  canMarkEvaluationReady,
  progressStatusAfterEvaluationReady,
  resolveEvaluationReadyUpdate,
  submissionStatusAfterEvaluationReady,
} from './collaboration-engine.js';
export {
  assertCourseInTenant,
  collaborationEnrollmentGate,
  resolveFacultySupervisedCourseIds,
} from './integrations.js';
export type {
  CollaborationActivityKind,
  CollaborationActivityRef,
  CollaborationAssignmentLink,
  CollaborationCourseContext,
  CollaborationEnrollmentGate,
  CollaborationEvaluationReadyInput,
  CollaborationEvaluationReadyResult,
  CollaborationEvaluationStatus,
  CollaborationFacultyContext,
  CollaborationGradebookBridge,
  CollaborationGradebookExportRecord,
  CollaborationProgressBridge,
  CollaborationStudentContext,
} from './types.js';
