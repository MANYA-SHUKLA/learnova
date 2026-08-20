import { describe, expect, it } from 'vitest';
import {
  createTimetableSchema,
  createTimetableSlotSchema,
  updateTimetableSlotSchema,
} from '@learnova/validation';

const OBJECT_ID = '507f1f77bcf86cd799439011';

describe('timetable validation', () => {
  it('creates timetable with required fields', () => {
    const parsed = createTimetableSchema.parse({
      semesterId: OBJECT_ID,
      academicYearId: OBJECT_ID,
      name: 'SOE JNU — Odd Sem 2026',
    });
    expect(parsed.name).toBe('SOE JNU — Odd Sem 2026');
  });

  it('rejects slot when end time is not after start time', () => {
    const result = createTimetableSlotSchema.safeParse({
      dayOfWeek: 'mon',
      startTime: '10:00',
      endTime: '09:00',
      courseId: OBJECT_ID,
      sectionId: OBJECT_ID,
      facultyId: OBJECT_ID,
      room: 'Room 101',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid slot payload', () => {
    const parsed = createTimetableSlotSchema.parse({
      dayOfWeek: 'mon',
      startTime: '09:00',
      endTime: '10:00',
      courseId: OBJECT_ID,
      sectionId: OBJECT_ID,
      facultyId: OBJECT_ID,
      room: 'Room 101',
    });
    expect(parsed.status).toBe('active');
  });

  it('allows partial slot updates', () => {
    const parsed = updateTimetableSlotSchema.parse({ room: 'Lab 3' });
    expect(parsed.room).toBe('Lab 3');
  });
});
