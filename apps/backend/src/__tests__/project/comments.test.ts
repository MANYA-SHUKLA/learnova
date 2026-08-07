import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { REGEX } from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');

const createProjectCommentBodySchema = z.object({
  submissionId: objectIdField.optional().nullable(),
  parentCommentId: objectIdField.optional().nullable(),
  body: z.string().trim().min(1).max(10000),
  attachments: z.array(objectIdField).max(10).optional().default([]),
});

const OBJECT_ID = '507f1f77bcf86cd799439011';

describe('project comments validation', () => {
  it('requires a non-empty body', () => {
    expect(createProjectCommentBodySchema.safeParse({ body: '' }).success).toBe(false);
    expect(createProjectCommentBodySchema.safeParse({ body: 'Looks good' }).success).toBe(true);
  });

  it('accepts optional submission and parent comment ids', () => {
    const parsed = createProjectCommentBodySchema.parse({
      body: 'Thread reply',
      submissionId: OBJECT_ID,
      parentCommentId: OBJECT_ID,
    });
    expect(parsed.submissionId).toBe(OBJECT_ID);
    expect(parsed.parentCommentId).toBe(OBJECT_ID);
  });

  it('defaults attachments to empty array', () => {
    const parsed = createProjectCommentBodySchema.parse({ body: 'Note' });
    expect(parsed.attachments).toEqual([]);
  });
});
