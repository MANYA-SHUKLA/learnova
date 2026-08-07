import { describe, expect, it } from 'vitest';
import { createProjectCommentSchema } from '@learnova/validation';

const OBJECT_ID = '507f1f77bcf86cd799439011';

describe('project comments validation', () => {
  it('requires a non-empty body', () => {
    expect(
      createProjectCommentSchema.safeParse({ projectId: OBJECT_ID, body: '' }).success,
    ).toBe(false);
    expect(
      createProjectCommentSchema.safeParse({ projectId: OBJECT_ID, body: 'Looks good' }).success,
    ).toBe(true);
  });

  it('accepts optional submission and parent comment ids', () => {
    const parsed = createProjectCommentSchema.parse({
      projectId: OBJECT_ID,
      body: 'Thread reply',
      submissionId: OBJECT_ID,
      parentCommentId: OBJECT_ID,
    });
    expect(parsed.submissionId).toBe(OBJECT_ID);
    expect(parsed.parentCommentId).toBe(OBJECT_ID);
  });
});
