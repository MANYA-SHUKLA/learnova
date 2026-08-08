import { describe, expect, it } from 'vitest';
import {
  createCourseAnnouncementSchema,
  notificationIdParamsSchema,
  notificationListQuerySchema,
  notificationTypeSchema,
} from '@learnova/validation';

describe('notification validation', () => {
  it('accepts list query with search and unread filter', () => {
    const parsed = notificationListQuerySchema.parse({
      q: 'exam',
      unreadOnly: 'true',
      page: '2',
      limit: '10',
    });
    expect(parsed.q).toBe('exam');
    expect(parsed.unreadOnly).toBe(true);
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(10);
  });

  it('validates notification id params', () => {
    const parsed = notificationIdParamsSchema.parse({
      notificationId: '507f1f77bcf86cd799439011',
    });
    expect(parsed.notificationId).toBe('507f1f77bcf86cd799439011');
  });

  it('accepts course announcement payload', () => {
    const parsed = createCourseAnnouncementSchema.parse({
      courseId: '507f1f77bcf86cd799439011',
      title: 'Class cancelled',
      body: 'Tomorrow’s session is moved online.',
    });
    expect(parsed.title).toBe('Class cancelled');
  });

  it('supports all notification types', () => {
    for (const type of [
      'assignment_due',
      'exam_scheduled',
      'project_deadline',
      'grade_published',
      'certificate_issued',
      'course_announcement',
    ] as const) {
      expect(notificationTypeSchema.parse(type)).toBe(type);
    }
  });
});
