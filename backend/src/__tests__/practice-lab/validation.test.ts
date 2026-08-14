import { describe, expect, it } from 'vitest';
import {
  createLabProblemSchema,
  createPracticeLabSchema,
  createTestCaseSchema,
  practiceLabListQuerySchema,
  runCodeSchema,
  submitSolutionSchema,
} from '@learnova/validation';

const OBJECT_ID = '507f1f77bcf86cd799439011';

describe('practice lab validation', () => {
  it('applies defaults when creating a practice lab', () => {
    const parsed = createPracticeLabSchema.parse({
      courseId: OBJECT_ID,
      title: 'Arrays Lab',
    });
    expect(parsed.visibility).toBe('enrolled');
    expect(parsed.difficulty).toBe('medium');
    expect(parsed.allowRun).toBe(true);
    expect(parsed.allowSubmit).toBe(true);
    expect(parsed.maxSubmissions).toBe(50);
    expect(parsed.languages.length).toBeGreaterThan(0);
  });

  it('rejects invalid courseId', () => {
    expect(
      createPracticeLabSchema.safeParse({ courseId: 'bad', title: 'X' }).success,
    ).toBe(false);
  });

  it('validates problem creation', () => {
    const parsed = createLabProblemSchema.parse({
      practiceLabId: OBJECT_ID,
      title: 'Sum',
      problemStatement: 'Add two numbers',
    });
    expect(parsed.difficulty).toBe('medium');
    expect(parsed.memoryLimitMB).toBe(256);
    expect(parsed.timeLimitMS).toBe(2000);
  });

  it('rejects empty problem statement', () => {
    expect(
      createLabProblemSchema.safeParse({
        practiceLabId: OBJECT_ID,
        title: 'X',
        problemStatement: '  ',
      }).success,
    ).toBe(false);
  });

  it('validates test cases', () => {
    const parsed = createTestCaseSchema.parse({
      problemId: OBJECT_ID,
      input: '1 2',
      expectedOutput: '3',
    });
    expect(parsed.visibility).toBe('hidden');
    expect(parsed.weight).toBe(1);
  });

  it('validates run and submit payloads', () => {
    expect(
      runCodeSchema.parse({
        language: 'python',
        sourceCode: 'print(1)',
        problemId: OBJECT_ID,
      }).language,
    ).toBe('python');

    expect(
      submitSolutionSchema.parse({
        problemId: OBJECT_ID,
        language: 'cpp',
        sourceCode: 'int main(){}',
        runExecutionId: OBJECT_ID,
      }).language,
    ).toBe('cpp');
  });

  it('parses list query filters', () => {
    const parsed = practiceLabListQuerySchema.parse({
      difficulty: 'hard',
      language: 'java',
      page: '2',
      limit: '10',
    });
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(10);
    expect(parsed.difficulty).toBe('hard');
  });
});
