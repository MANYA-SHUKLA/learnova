import { describe, expect, it } from 'vitest';
import {
  createQuestionBankSchema,
  createQuestionSchema,
  createQuizSchema,
  quizBulkActionSchema,
  quizListQuerySchema,
  startAttemptSchema,
  submitAnswerSchema,
  submitQuizSchema,
  updateQuizSchema,
} from '@learnova/validation';

const OBJECT_ID = '507f1f77bcf86cd799439011';

describe('quiz validation', () => {
  it('applies defaults when creating a quiz', () => {
    const parsed = createQuizSchema.parse({
      courseId: OBJECT_ID,
      title: 'Weekly Practice Quiz',
    });

    expect(parsed.quizType).toBe('practice');
    expect(parsed.visibility).toBe('enrolled');
    expect(parsed.totalMarks).toBe(100);
    expect(parsed.passingMarks).toBe(40);
    expect(parsed.attemptLimit).toBe(3);
    expect(parsed.shuffleQuestions).toBe(false);
    expect(parsed.negativeMarking).toBe(false);
  });

  it('rejects a non-ObjectId courseId', () => {
    const result = createQuizSchema.safeParse({ courseId: 'nope', title: 'X' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty title', () => {
    const result = createQuizSchema.safeParse({ courseId: OBJECT_ID, title: '   ' });
    expect(result.success).toBe(false);
  });

  it('makes update partial and drops courseId', () => {
    const parsed = updateQuizSchema.parse({ title: 'Renamed Quiz' });
    expect(parsed.title).toBe('Renamed Quiz');
    expect('courseId' in parsed).toBe(false);
  });

  it('validates quiz list query defaults', () => {
    const parsed = quizListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
    expect(parsed.sortBy).toBe('createdAt');
    expect(parsed.sortOrder).toBe('desc');
  });

  it('validates question creation with defaults', () => {
    const parsed = createQuestionSchema.parse({
      questionBankId: OBJECT_ID,
      question: 'What is 2 + 2?',
      questionType: 'single_choice',
    });

    expect(parsed.difficulty).toBe('medium');
    expect(parsed.marks).toBe(1);
    expect(parsed.negativeMarks).toBe(0);
    expect(parsed.options).toEqual([]);
  });

  it('validates question bank creation', () => {
    const parsed = createQuestionBankSchema.parse({ title: 'Physics Bank' });
    expect(parsed.categoryIds).toEqual([]);
    expect(parsed.tagIds).toEqual([]);
  });

  it('validates start attempt input', () => {
    const parsed = startAttemptSchema.parse({ quizId: OBJECT_ID });
    expect(parsed.quizId).toBe(OBJECT_ID);
  });

  it('validates submit answer input', () => {
    const parsed = submitAnswerSchema.parse({
      questionId: OBJECT_ID,
      selectedOptionIds: [OBJECT_ID],
    });
    expect(parsed.timeSpentSeconds).toBe(0);
  });

  it('validates submit quiz input', () => {
    const parsed = submitQuizSchema.parse({ attemptId: OBJECT_ID });
    expect(parsed.answers).toEqual([]);
  });

  it('validates bulk action schema', () => {
    const parsed = quizBulkActionSchema.parse({
      ids: [OBJECT_ID],
      action: 'publish',
    });
    expect(parsed.action).toBe('publish');
  });
});
