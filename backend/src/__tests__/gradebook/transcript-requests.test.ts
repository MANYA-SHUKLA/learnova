import { describe, expect, it } from 'vitest';
import {
  createTranscriptRequestSchema,
  reviewTranscriptRequestSchema,
} from '@learnova/validation';

describe('transcript requests', () => {
  it('accepts student transcript request', () => {
    const parsed = createTranscriptRequestSchema.parse({
      requestType: 'official',
      reason: 'Graduate school application',
    });
    expect(parsed.requestType).toBe('official');
  });

  it('accepts faculty review payload', () => {
    const parsed = reviewTranscriptRequestSchema.parse({
      requestId: '507f1f77bcf86cd799439011',
      status: 'approved',
      reviewNotes: 'Eligible',
    });
    expect(parsed.status).toBe('approved');
  });
});
