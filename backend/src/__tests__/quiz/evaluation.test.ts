import { describe, expect, it } from 'vitest';
import {
  canStartAttempt,
  evaluateAnswer,
  evaluateAttempt,
  isAttemptExpired,
  nextAttemptNumber,
  remainingSeconds,
  resolveAttemptStatus,
} from '../../services/quiz-engine/index.js';

describe('quiz engine evaluation', () => {
  const singleChoiceQuestion = {
    id: 'q1',
    questionType: 'single_choice' as const,
    marks: 4,
    negativeMarks: 1,
    options: [
      { id: 'a', isCorrect: true },
      { id: 'b', isCorrect: false },
    ],
    matchPairs: [],
    fillBlankAnswers: [],
  };

  it('awards full marks for a correct single-choice answer', () => {
    const result = evaluateAnswer(
      singleChoiceQuestion,
      { questionId: 'q1', selectedOptionIds: ['a'], textAnswer: null, matchAnswers: {} },
      false,
    );
    expect(result.isCorrect).toBe(true);
    expect(result.marksAwarded).toBe(4);
    expect(result.skipped).toBe(false);
  });

  it('applies negative marking for an incorrect answer', () => {
    const result = evaluateAnswer(
      singleChoiceQuestion,
      { questionId: 'q1', selectedOptionIds: ['b'], textAnswer: null, matchAnswers: {} },
      true,
    );
    expect(result.isCorrect).toBe(false);
    expect(result.marksAwarded).toBe(-1);
  });

  it('marks unanswered questions as skipped', () => {
    const result = evaluateAnswer(
      singleChoiceQuestion,
      { questionId: 'q1', selectedOptionIds: [], textAnswer: null, matchAnswers: {} },
      false,
    );
    expect(result.skipped).toBe(true);
    expect(result.marksAwarded).toBe(0);
  });

  it('evaluates fill-in-the-blank answers case-insensitively', () => {
    const result = evaluateAnswer(
      {
        id: 'q2',
        questionType: 'fill_blank',
        marks: 2,
        negativeMarks: 0.5,
        options: [],
        matchPairs: [],
        fillBlankAnswers: ['Paris'],
      },
      { questionId: 'q2', selectedOptionIds: [], textAnswer: ' paris ', matchAnswers: {} },
      false,
    );
    expect(result.isCorrect).toBe(true);
    expect(result.marksAwarded).toBe(2);
  });

  it('aggregates attempt scores and pass status', () => {
    const result = evaluateAttempt(
      [singleChoiceQuestion],
      [{ questionId: 'q1', selectedOptionIds: ['a'], textAnswer: null, matchAnswers: {} }],
      { passingMarks: 40, totalMarks: 100, negativeMarking: false },
    );

    expect(result.score).toBe(4);
    expect(result.correct).toBe(1);
    expect(result.incorrect).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.passed).toBe(false);
  });
});

describe('quiz engine attempt rules', () => {
  it('allows attempts below the limit', () => {
    expect(canStartAttempt(0, 3)).toBe(true);
    expect(canStartAttempt(2, 3)).toBe(true);
    expect(canStartAttempt(3, 3)).toBe(false);
  });

  it('increments attempt numbers', () => {
    expect(nextAttemptNumber(0)).toBe(1);
    expect(nextAttemptNumber(2)).toBe(3);
  });

  it('detects expired timed attempts', () => {
    const startedAt = new Date(Date.now() - 31 * 60 * 1000);
    const ctx = {
      activityId: 'quiz1',
      attemptId: 'attempt1',
      studentId: 'student1',
      startedAt,
      durationMinutes: 30,
    };
    expect(isAttemptExpired(ctx)).toBe(true);
    expect(remainingSeconds(ctx)).toBe(0);
  });

  it('resolves attempt status after submission or expiry', () => {
    expect(resolveAttemptStatus('started', true, false)).toBe('completed');
    expect(resolveAttemptStatus('started', false, true)).toBe('expired');
    expect(resolveAttemptStatus('started', false, false)).toBe('started');
  });
});
