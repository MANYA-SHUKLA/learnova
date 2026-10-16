import { describe, expect, it } from 'vitest';
import {
  classYearForSemesterNumber,
  semesterDateRange,
  semesterNumberFor,
  termForSemesterNumber,
} from '../../utils/timetable/academic-calendar.js';

describe('academic calendar', () => {
  it('maps class years 1–4 onto odd and even semesters', () => {
    expect(semesterNumberFor(1, 'odd')).toBe(1);
    expect(semesterNumberFor(1, 'even')).toBe(2);
    expect(semesterNumberFor(2, 'odd')).toBe(3);
    expect(semesterNumberFor(4, 'even')).toBe(8);
    expect(classYearForSemesterNumber(1)).toBe(1);
    expect(classYearForSemesterNumber(7)).toBe(4);
    expect(termForSemesterNumber(1)).toBe('odd');
    expect(termForSemesterNumber(2)).toBe('even');
  });

  it('keeps odd semesters in July–December and even semesters in January–May', () => {
    const odd = semesterDateRange(2026, 'odd');
    const even = semesterDateRange(2027, 'even');
    expect(odd.startDate.toISOString().slice(0, 10)).toBe('2026-07-01');
    expect(odd.endDate.toISOString().slice(0, 10)).toBe('2026-12-31');
    expect(even.startDate.toISOString().slice(0, 10)).toBe('2027-01-01');
    expect(even.endDate.toISOString().slice(0, 10)).toBe('2027-05-31');
  });
});
