import { describe, expect, it } from 'vitest';
import { EXAM_ANNOUNCEMENT_TYPES } from '@learnova/constants';
import { createExamAnnouncementSchema } from '@learnova/validation';

describe('exam announcements', () => {
  it('accepts valid broadcast payload', () => {
    const parsed = createExamAnnouncementSchema.parse({
      examId: '507f1f77bcf86cd799439011',
      title: 'Time extension',
      message: 'You have 10 additional minutes.',
      announcementType: 'time_extension',
      isEmergency: false,
    });
    expect(parsed.title).toBe('Time extension');
    expect(parsed.announcementType).toBe('time_extension');
  });

  it('exports all announcement types', () => {
    expect(EXAM_ANNOUNCEMENT_TYPES).toContain('emergency_stop');
    expect(EXAM_ANNOUNCEMENT_TYPES).toHaveLength(5);
  });
});
