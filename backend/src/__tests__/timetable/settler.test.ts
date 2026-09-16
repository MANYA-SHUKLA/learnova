import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LAB_ROOMS,
  DEFAULT_LECTURE_ROOMS,
  DEFAULT_PERIODS,
  DEFAULT_WORKING_DAYS,
  extractTeachingMap,
  fillUnassignedFaculty,
  isLabCourse,
  parseGeminiTimetableProposal,
  settleTimetable,
  sessionsPerWeek,
  type CourseRecord,
  type FacultyRecord,
  type SectionRecord,
} from '../../services/timetable/timetable-settler.js';

const faculty: FacultyRecord[] = [
  {
    id: 'f1',
    name: 'Dr Ada',
    departmentId: 'd1',
    specialization: 'databases',
    courseIds: ['c2'],
  },
  {
    id: 'f2',
    name: 'Prof Turing',
    departmentId: 'd2',
    specialization: 'networks',
    courseIds: [],
  },
];

const courses: CourseRecord[] = [
  {
    id: 'c1',
    title: 'Intro to Programming',
    credits: 3,
    facultyIds: ['f2'],
    coordinatorId: 'f2',
    programIds: ['p1'],
    departmentId: 'd2',
    category: 'programming',
  },
  {
    id: 'c2',
    title: 'Databases',
    credits: 2,
    facultyIds: [],
    coordinatorId: null,
    programIds: ['p1'],
    departmentId: 'd1',
    category: 'database',
  },
];

const sections: SectionRecord[] = [
  { id: 's1', name: 'A', programId: 'p1' },
  { id: 's2', name: 'B', programId: 'p2' },
];

describe('timetable settler', () => {
  it('computes sessions from credits with a 2–4 cap', () => {
    expect(sessionsPerWeek(0)).toBe(2);
    expect(sessionsPerWeek(3)).toBe(3);
    expect(sessionsPerWeek(8)).toBe(4);
  });

  it('extracts faculty from course links and reverse courseIds', () => {
    const map = extractTeachingMap(courses, faculty);
    expect(map.get('c1')).toBe('f2');
    expect(map.get('c2')).toBe('f1');
  });

  it('lets Gemini fill only unassigned courses', () => {
    const current = extractTeachingMap(
      [{ ...courses[0]!, facultyIds: [], coordinatorId: null }],
      faculty,
    );
    const filled = fillUnassignedFaculty(
      [{ ...courses[0]!, facultyIds: [], coordinatorId: null }],
      faculty,
      current,
      [{ courseId: 'c1', facultyId: 'f1' }],
    );
    expect(filled.get('c1')).toBe('f1');
  });

  it('parses Gemini proposals and drops invalid rows', () => {
    const parsed = parseGeminiTimetableProposal({
      assignments: [{ courseId: 'c1', facultyId: 'f2' }, { courseId: 1 }],
      slots: [
        {
          dayOfWeek: 'mon',
          startTime: '9:00',
          endTime: '10:00',
          courseId: 'c1',
          sectionId: 's1',
          facultyId: 'f2',
          room: 'R-101',
        },
        {
          dayOfWeek: 'mon',
          startTime: '10:00',
          endTime: '09:00',
          courseId: 'c1',
          sectionId: 's1',
          facultyId: 'f2',
        },
      ],
    });
    expect(parsed.assignments).toEqual([{ courseId: 'c1', facultyId: 'f2' }]);
    expect(parsed.slots).toHaveLength(1);
    expect(parsed.slots[0]?.startTime).toBe('09:00');
  });

  it('places non-overlapping slots and repairs faculty clashes', () => {
    const result = settleTimetable({
      courses: [courses[0]!],
      faculty,
      sections: [sections[0]!],
      workingDays: ['mon', 'tue'],
      periods: [
        { startTime: '09:00', endTime: '10:00' },
        { startTime: '10:00', endTime: '11:00' },
      ],
      proposedSlots: [
        {
          dayOfWeek: 'mon',
          startTime: '09:00',
          endTime: '10:00',
          courseId: 'c1',
          sectionId: 's1',
          facultyId: 'f2',
          room: 'R-101',
        },
        {
          dayOfWeek: 'mon',
          startTime: '09:00',
          endTime: '10:00',
          courseId: 'c1',
          sectionId: 's1',
          facultyId: 'f2',
          room: 'R-101',
        },
      ],
    });

    expect(result.assignments[0]?.facultyId).toBe('f2');
    expect(result.slots.length).toBe(3);
    const mondayMorning = result.slots.filter(
      (slot) => slot.dayOfWeek === 'mon' && slot.startTime === '09:00',
    );
    expect(mondayMorning).toHaveLength(1);
    const facultyClashes = result.slots.filter((slot, index, all) =>
      all.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          other.facultyId === slot.facultyId &&
          other.dayOfWeek === slot.dayOfWeek &&
          other.startTime === slot.startTime,
      ),
    );
    expect(facultyClashes).toHaveLength(0);
  });

  it('does not schedule a course into a section of another program', () => {
    const result = settleTimetable({
      courses: [courses[0]!],
      faculty,
      sections,
      workingDays: ['mon'],
      periods: [{ startTime: '09:00', endTime: '10:00' }],
    });
    expect(result.slots.every((slot) => slot.sectionId === 's1')).toBe(true);
  });

  it('keeps the SOE JNU grid: Mon–Fri, 09:00–18:00, ELC and SOE labs', () => {
    expect(DEFAULT_WORKING_DAYS).toEqual(['mon', 'tue', 'wed', 'thu', 'fri']);
    expect(DEFAULT_PERIODS[0]).toEqual({ startTime: '09:00', endTime: '10:00' });
    expect(DEFAULT_PERIODS.at(-1)).toEqual({ startTime: '17:00', endTime: '18:00' });
    expect(DEFAULT_PERIODS.some((period) => period.startTime === '13:00')).toBe(false);

    const result = settleTimetable({
      courses: [courses[0]!],
      faculty,
      sections: [sections[0]!],
      workingDays: DEFAULT_WORKING_DAYS,
      periods: DEFAULT_PERIODS,
    });

    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots.every((slot) => DEFAULT_WORKING_DAYS.includes(slot.dayOfWeek))).toBe(true);
    expect(result.slots.every((slot) => slot.startTime >= '09:00' && slot.endTime <= '18:00')).toBe(true);
    expect(
      result.slots.every(
        (slot) =>
          DEFAULT_LECTURE_ROOMS.includes(slot.room as (typeof DEFAULT_LECTURE_ROOMS)[number]) ||
          DEFAULT_LAB_ROOMS.includes(slot.room as (typeof DEFAULT_LAB_ROOMS)[number]),
      ),
    ).toBe(true);
  });

  it('puts lab courses in SOE labs and remaps unknown rooms', () => {
    const labCourse: CourseRecord = {
      ...courses[0]!,
      id: 'c-lab',
      title: 'Programming Lab',
      category: 'programming',
    };
    expect(isLabCourse(labCourse)).toBe(true);

    const result = settleTimetable({
      courses: [labCourse],
      faculty,
      sections: [sections[0]!],
      workingDays: ['mon'],
      periods: [{ startTime: '09:00', endTime: '10:00' }],
      proposedSlots: [
        {
          dayOfWeek: 'mon',
          startTime: '09:00',
          endTime: '10:00',
          courseId: 'c-lab',
          sectionId: 's1',
          facultyId: 'f2',
          room: 'R-101',
        },
      ],
    });

    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots.every((slot) => DEFAULT_LAB_ROOMS.includes(slot.room as (typeof DEFAULT_LAB_ROOMS)[number]))).toBe(
      true,
    );
  });
});
