import { describe, expect, it } from 'vitest';
import {
  compareDayOfWeek,
  dayOfWeekFromDate,
  sortSlotsByDayAndTime,
  timesOverlap,
} from '../../src/utils/timetable/time.js';

describe('timetable time utils', () => {
  it('detects overlapping time ranges', () => {
    expect(timesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true);
    expect(timesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
    expect(timesOverlap('09:00', '10:00', '08:00', '09:00')).toBe(false);
  });

  it('orders days Monday through Sunday', () => {
    expect(compareDayOfWeek('mon', 'wed')).toBeLessThan(0);
    expect(compareDayOfWeek('sun', 'mon')).toBeGreaterThan(0);
  });

  it('sorts slots by day then start time', () => {
    const sorted = sortSlotsByDayAndTime([
      { dayOfWeek: 'wed', startTime: '14:00' },
      { dayOfWeek: 'mon', startTime: '10:00' },
      { dayOfWeek: 'mon', startTime: '09:00' },
    ]);
    expect(sorted.map((s) => `${s.dayOfWeek}-${s.startTime}`)).toEqual([
      'mon-09:00',
      'mon-10:00',
      'wed-14:00',
    ]);
  });

  it('resolves weekday in Asia/Kolkata', () => {
    const monday = new Date('2026-08-17T04:00:00.000Z');
    expect(dayOfWeekFromDate(monday, 'Asia/Kolkata')).toBe('mon');
  });
});
