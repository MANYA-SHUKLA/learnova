import { describe, expect, it } from 'vitest';
import {
  assessmentQuestionEngine,
  canStartQuestionAttempt,
  computeQuestionAccuracy,
  computePassRate,
  evaluateQuestionAnswer,
  isTimedAttemptExpired,
  nextQuestionAttemptNumber,
  rankMostIncorrectQuestions,
  remainingAttemptSeconds,
  resolveTimedAttemptStatus,
  scoreQuestionAttempt,
} from '@learnova/shared';

describe('Assessment Core — question evaluation', () => {
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
    const result = evaluateQuestionAnswer(
      singleChoiceQuestion,
      { questionId: 'q1', selectedOptionIds: ['a'], textAnswer: null, matchAnswers: {} },
      false,
    );
    expect(result.isCorrect).toBe(true);
    expect(result.marksAwarded).toBe(4);
  });

  it('scores a full question attempt', () => {
    const result = scoreQuestionAttempt(
      [singleChoiceQuestion],
      [{ questionId: 'q1', selectedOptionIds: ['a'], textAnswer: null, matchAnswers: {} }],
      { passingMarks: 40, totalMarks: 100, negativeMarking: false },
    );
    expect(result.score).toBe(4);
    expect(result.correct).toBe(1);
    expect(result.passed).toBe(false);
  });

  it('exposes assessmentQuestionEngine facade', () => {
    expect(assessmentQuestionEngine.scoreQuestionAttempt).toBe(scoreQuestionAttempt);
  });
});

describe('Assessment Core — timed attempt lifecycle', () => {
  it('enforces attempt limits', () => {
    expect(canStartQuestionAttempt(0, 3)).toBe(true);
    expect(canStartQuestionAttempt(3, 3)).toBe(false);
    expect(nextQuestionAttemptNumber(2)).toBe(3);
  });

  it('detects expired timed attempts', () => {
    const ctx = {
      activityId: 'quiz1',
      attemptId: 'attempt1',
      studentId: 'student1',
      startedAt: new Date(Date.now() - 31 * 60 * 1000),
      durationMinutes: 30,
    };
    expect(isTimedAttemptExpired(ctx)).toBe(true);
    expect(remainingAttemptSeconds(ctx)).toBe(0);
    expect(resolveTimedAttemptStatus('started', false, true)).toBe('expired');
  });
});

describe('Assessment Core — question analytics', () => {
  it('computes accuracy and pass rate', () => {
    expect(computeQuestionAccuracy(3, 4)).toBe(75);
    expect(computePassRate(8, 10)).toBe(80);
  });

  it('ranks most incorrect questions', () => {
    const ranked = rankMostIncorrectQuestions(
      [
        {
          questionId: 'a',
          title: 'A',
          accuracy: 90,
          incorrectRate: 10,
          averageTimeSeconds: 5,
          difficulty: 'easy',
        },
        {
          questionId: 'b',
          title: 'B',
          accuracy: 40,
          incorrectRate: 60,
          averageTimeSeconds: 8,
          difficulty: 'hard',
        },
      ],
      1,
    );
    expect(ranked[0]?.questionId).toBe('b');
  });
});
