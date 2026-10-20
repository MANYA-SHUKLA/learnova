import { describe, expect, it } from 'vitest';
import { validateJnuTimetable } from '../../services/timetable/jnu-timetable-validator.js';

describe('validateJnuTimetable', () => {
  it('detects faculty and room clashes', () => {
    const base = {
      dayOfWeek: 'mon' as const,
      startTime: '09:00',
      endTime: '10:00',
      facultyId: 'f1',
      facultyName: 'Dr. A',
      sectionId: 's1',
      sectionName: 'B.Tech CSE Sem I',
      room: 'JC BOSE',
      courseTitle: 'EN103',
    };
    const report = validateJnuTimetable([
      base,
      { ...base, sectionId: 's2', sectionName: 'B.Tech ECE Sem I', courseTitle: 'EN102' },
    ]);
    expect(report.valid).toBe(false);
    expect(report.facultyClashes.length).toBeGreaterThan(0);
    expect(report.roomClashes.length).toBeGreaterThan(0);
  });

  it('detects cohort clash for same section', () => {
    const report = validateJnuTimetable([
      {
        dayOfWeek: 'tue',
        startTime: '10:00',
        endTime: '11:00',
        facultyId: 'f1',
        sectionId: 's1',
        sectionName: 'B.Tech CSE Sem III',
        room: 'ROOM A',
        courseTitle: 'EN303',
      },
      {
        dayOfWeek: 'tue',
        startTime: '10:00',
        endTime: '11:00',
        facultyId: 'f2',
        sectionId: 's1',
        sectionName: 'B.Tech CSE Sem III',
        room: 'ROOM B',
        courseTitle: 'EN469',
      },
    ]);
    expect(report.cohortClashes.length).toBe(1);
    expect(report.valid).toBe(false);
  });

  it('passes non-overlapping slots', () => {
    const report = validateJnuTimetable([
      {
        dayOfWeek: 'mon',
        startTime: '09:00',
        endTime: '10:00',
        facultyId: 'f1',
        sectionId: 's1',
        sectionName: 'B.Tech CSE Sem I',
        room: 'JC BOSE',
        courseTitle: 'EN103',
      },
      {
        dayOfWeek: 'mon',
        startTime: '10:00',
        endTime: '11:00',
        facultyId: 'f1',
        sectionId: 's1',
        sectionName: 'B.Tech CSE Sem I',
        room: 'JC BOSE',
        courseTitle: 'EN102',
      },
    ]);
    expect(report.facultyClashes.length).toBe(0);
    expect(report.cohortClashes.length).toBe(0);
  });
});
