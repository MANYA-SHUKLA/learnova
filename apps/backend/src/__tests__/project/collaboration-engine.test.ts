import { describe, expect, it } from 'vitest';
import {
  canMarkEvaluationReady,
  progressStatusAfterEvaluationReady,
  submissionStatusAfterEvaluationReady,
} from '../../services/collaboration-engine/index.js';

describe('collaboration engine evaluation helpers', () => {
  it('blocks draft submissions', () => {
    const result = canMarkEvaluationReady({ submissionStatus: 'draft', evaluationStatus: 'pending' });
    expect(result.ok).toBe(false);
  });

  it('allows submitted pending records', () => {
    const result = canMarkEvaluationReady({ submissionStatus: 'submitted', evaluationStatus: 'pending' });
    expect(result.ok).toBe(true);
  });

  it('maps evaluation ready progress status', () => {
    expect(progressStatusAfterEvaluationReady()).toBe('evaluation_ready');
    expect(submissionStatusAfterEvaluationReady(false)).toBe('submitted');
    expect(submissionStatusAfterEvaluationReady(true)).toBe('returned');
  });
});
