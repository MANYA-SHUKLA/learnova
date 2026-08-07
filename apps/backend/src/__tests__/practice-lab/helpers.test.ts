import { describe, expect, it } from 'vitest';
import {
  canTransitionStatus,
  computeSubmissionScore,
  mapJudge0StatusToExecutionStatus,
  normalizeOutput,
  outputsMatch,
  slugifyProblemTitle,
} from '../../services/practice-lab/practice-lab.helpers.js';
import {
  computeSubmissionScore as engineScore,
  mapJudge0StatusToExecutionStatus as engineMap,
  outputsMatch as engineMatch,
  verdictToExecutionStatus,
} from '@learnova/shared';

describe('practice lab helpers', () => {
  it('normalizes trailing whitespace for output compare', () => {
    expect(outputsMatch('5\n', '5')).toBe(true);
    expect(outputsMatch('a  \nb', 'a\nb')).toBe(true);
    expect(outputsMatch('5', '6')).toBe(false);
    expect(normalizeOutput('x\r\n')).toBe('x');
  });

  it('computes accepted / partial / compilation verdicts', () => {
    expect(
      computeSubmissionScore([
        { passed: true, weight: 1, status: 'accepted' },
        { passed: true, weight: 2, status: 'accepted' },
      ]).verdict,
    ).toBe('accepted');

    expect(
      computeSubmissionScore([
        { passed: true, weight: 1, status: 'accepted' },
        { passed: false, weight: 2, status: 'wrong_answer' },
      ]).verdict,
    ).toBe('partial');

    expect(
      computeSubmissionScore([
        { passed: false, weight: 1, status: 'compilation_error' },
      ]).verdict,
    ).toBe('compilation_error');
  });

  it('slugifies titles', () => {
    expect(slugifyProblemTitle('Sum of Two Numbers!')).toBe('sum-of-two-numbers');
  });

  it('allows lifecycle transitions via assessment core', () => {
    expect(canTransitionStatus('draft', 'published')).toBe(true);
    expect(canTransitionStatus('published', 'archived')).toBe(true);
    expect(canTransitionStatus('draft', 'closed')).toBe(false);
  });

  it('maps Judge0 status ids', () => {
    expect(mapJudge0StatusToExecutionStatus(1)).toBe('queued');
    expect(mapJudge0StatusToExecutionStatus(2)).toBe('running');
    expect(mapJudge0StatusToExecutionStatus(3)).toBe('accepted');
    expect(mapJudge0StatusToExecutionStatus(4)).toBe('wrong_answer');
    expect(mapJudge0StatusToExecutionStatus(5)).toBe('time_limit_exceeded');
    expect(mapJudge0StatusToExecutionStatus(6)).toBe('compilation_error');
    expect(mapJudge0StatusToExecutionStatus(7)).toBe('runtime_error');
  });
});

describe('coding engine shared scoring (reusable by exams)', () => {
  it('re-exports the same pure scoring contract from @learnova/shared', () => {
    expect(engineMatch('ok\n', 'ok')).toBe(true);
    expect(
      engineScore([{ passed: true, weight: 1, status: 'accepted' }]).verdict,
    ).toBe('accepted');
    expect(engineMap(3)).toBe('accepted');
    expect(verdictToExecutionStatus('partial')).toBe('wrong_answer');
    expect(verdictToExecutionStatus('accepted')).toBe('accepted');
  });
});
