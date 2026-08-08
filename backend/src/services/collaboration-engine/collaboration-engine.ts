import type {
  CollaborationEvaluationReadyInput,
  CollaborationEvaluationReadyResult,
  CollaborationEvaluationStatus,
} from './types.js';

/**
 * Pure collaboration helpers — no grading, no certificates.
 * Gradebook (Step 13) consumes evaluation-ready records produced by ProjectService.
 */

export function canMarkEvaluationReady(input: {
  submissionStatus: string;
  evaluationStatus: CollaborationEvaluationStatus | null | undefined;
}): { ok: true } | { ok: false; reason: string } {
  if (input.submissionStatus === 'draft') {
    return { ok: false, reason: 'Cannot mark a draft submission as evaluation ready' };
  }
  if (input.evaluationStatus === 'ready') {
    return { ok: false, reason: 'Submission is already marked evaluation ready' };
  }
  if (input.evaluationStatus === 'exported') {
    return { ok: false, reason: 'Submission was already exported to gradebook' };
  }
  return { ok: true };
}

export function resolveEvaluationReadyUpdate(
  input: CollaborationEvaluationReadyInput & { now?: Date },
): CollaborationEvaluationReadyResult {
  const now = input.now ?? new Date();
  return {
    submissionId: input.submissionId,
    evaluationStatus: 'ready',
    evaluationReadyAt: now.toISOString(),
  };
}

export function submissionStatusAfterEvaluationReady(returnToStudent: boolean): string {
  return returnToStudent ? 'returned' : 'submitted';
}

export function progressStatusAfterEvaluationReady(): 'evaluation_ready' {
  return 'evaluation_ready';
}
