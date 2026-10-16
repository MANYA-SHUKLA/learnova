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
  type OccupiedSlot,
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

  it('does not reuse a teacher who already teaches the other term', () => {
    const shared: CourseRecord = {
      ...courses[0]!,
      id: 'c-shared',
      facultyIds: ['f1', 'f2'],
      coordinatorId: 'f1',
    };
    const map = extractTeachingMap([shared], faculty, { avoidFacultyIds: new Set(['f1']) });
    expect(map.get('c-shared')).toBe('f2');

    const result = settleTimetable({
      courses: [shared],
      faculty,
      sections: [sections[0]!],
      workingDays: ['mon'],
      periods: [
        { startTime: '09:00', endTime: '10:00' },
        { startTime: '10:00', endTime: '11:00' },
      ],
      avoidFacultyIds: ['f1'],
      occupied: [
        {
          dayOfWeek: 'mon',
          startTime: '09:00',
          endTime: '10:00',
          facultyId: 'f2',
          room: 'ELC Class 1',
        },
      ],
    });
    expect(result.assignments[0]?.facultyId).toBe('f2');
    expect(result.slots.some((slot) => slot.facultyId === 'f2' && slot.startTime === '09:00')).toBe(false);
    expect(result.slots.some((slot) => slot.facultyId === 'f2' && slot.startTime === '10:00')).toBe(true);
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

  it('keeps the SOE JNU grid: Mon–Fri, 09:00–18:00, and only 3 rooms', () => {
    expect(DEFAULT_WORKING_DAYS).toEqual(['mon', 'tue', 'wed', 'thu', 'fri']);
    expect(DEFAULT_PERIODS[0]).toEqual({ startTime: '09:00', endTime: '10:00' });
    expect(DEFAULT_PERIODS.at(-1)).toEqual({ startTime: '17:00', endTime: '18:00' });
    expect(DEFAULT_PERIODS.some((period) => period.startTime === '13:00')).toBe(false);
    expect(DEFAULT_LECTURE_ROOMS).toEqual(['ELC Class 1', 'ELC Class 2', 'ELC Class 3']);
    expect(DEFAULT_LAB_ROOMS).toEqual(DEFAULT_LECTURE_ROOMS);

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
      result.slots.every((slot) =>
        DEFAULT_LECTURE_ROOMS.includes(slot.room as (typeof DEFAULT_LECTURE_ROOMS)[number]),
      ),
    ).toBe(true);
  });

  it('puts lab courses in the 3 campus rooms and remaps unknown rooms', () => {
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

  it('keeps a subject shared by CSE and ECE as one combined class', () => {
    const mathsCse: CourseRecord = {
      ...courses[0]!,
      id: 'math-cse',
      title: 'Engineering Mathematics I',
      credits: 4,
      facultyIds: ['f1'],
      coordinatorId: 'f1',
      programIds: ['cse'],
      departmentId: 'd1',
    };
    const mathsEce: CourseRecord = {
      ...courses[0]!,
      id: 'math-ece',
      title: 'Engineering Mathematics I',
      credits: 4,
      facultyIds: ['f2'],
      coordinatorId: 'f2',
      programIds: ['ece'],
      departmentId: 'd2',
    };
    const circuits: CourseRecord = {
      ...courses[0]!,
      id: 'circuits',
      title: 'Circuit Theory',
      credits: 3,
      facultyIds: ['f2'],
      coordinatorId: 'f2',
      programIds: ['ece'],
      departmentId: 'd2',
    };
    const branchSections: SectionRecord[] = [
      { id: 'cse-y1', name: 'CSE Year 1', programId: 'cse' },
      { id: 'ece-y1', name: 'ECE Year 1', programId: 'ece' },
    ];

    const result = settleTimetable({
      courses: [mathsCse, mathsEce, circuits],
      faculty,
      sections: branchSections,
      workingDays: ['mon', 'tue'],
      periods: [
        { startTime: '09:00', endTime: '10:00' },
        { startTime: '10:00', endTime: '11:00' },
        { startTime: '11:00', endTime: '12:00' },
      ],
    });

    const mathsSlots = result.slots.filter((slot) => slot.courseTitle === 'Engineering Mathematics I');
    const meetings = new Map<string, typeof mathsSlots>();
    for (const slot of mathsSlots) {
      const key = `${slot.dayOfWeek}|${slot.startTime}|${slot.room}|${slot.facultyId}`;
      const list = meetings.get(key) ?? [];
      list.push(slot);
      meetings.set(key, list);
    }

    expect(meetings.size).toBe(4);
    for (const group of meetings.values()) {
      expect(group.map((slot) => slot.sectionId).sort()).toEqual(['cse-y1', 'ece-y1']);
      expect(new Set(group.map((slot) => slot.facultyId)).size).toBe(1);
    }
    expect(result.assignments.filter((row) => row.courseTitle === 'Engineering Mathematics I').map((row) => row.facultyId)).toEqual([
      meetings.values().next().value?.[0]?.facultyId,
      meetings.values().next().value?.[0]?.facultyId,
    ]);

    const busy = new Map<string, Set<string>>();
    for (const slot of result.slots) {
      const key = `${slot.dayOfWeek}|${slot.startTime}|${slot.room.toLowerCase()}`;
      const titles = busy.get(key) ?? new Set<string>();
      titles.add(slot.courseTitle);
      busy.set(key, titles);
      expect(titles.size).toBe(1);
    }

    const roomsAtNine = new Set(
      result.slots.filter((slot) => slot.dayOfWeek === 'mon' && slot.startTime === '09:00').map((slot) => slot.room),
    );
    expect(roomsAtNine.size).toBeLessThanOrEqual(3);
    expect(result.warnings.some((warning) => warning.includes('combined class'))).toBe(true);
  });

  it('schedules every odd-semester CSE and ECE class inside 3 rooms', () => {
    const years: { title: string; credits: number; lab?: boolean }[][] = [
      [
        { title: 'Engineering Mathematics I', credits: 4 },
        { title: 'Branch Subject A', credits: 3 },
        { title: 'Branch Subject B', credits: 3 },
        { title: 'Branch Subject C', credits: 3 },
        { title: 'Branch Lab', credits: 2, lab: true },
      ],
      [
        { title: 'Core A', credits: 4 },
        { title: 'Core B', credits: 3 },
        { title: 'Core C', credits: 3 },
        { title: 'Core D', credits: 3 },
        { title: 'Core Lab', credits: 2, lab: true },
      ],
      [
        { title: 'Advanced A', credits: 4 },
        { title: 'Advanced B', credits: 3 },
        { title: 'Advanced C', credits: 3 },
        { title: 'Advanced D', credits: 3 },
        { title: 'Advanced Lab', credits: 2, lab: true },
      ],
      [
        { title: 'Final A', credits: 3 },
        { title: 'Final B', credits: 3 },
        { title: 'Final C', credits: 3 },
        { title: 'Final Seminar', credits: 2 },
        { title: 'Final Lab', credits: 2, lab: true },
      ],
    ];

    let occupied: OccupiedSlot[] = [];
    for (const [index, subjects] of years.entries()) {
      const year = String(4 - index);
      const courses: CourseRecord[] = [];
      const facultyRows: FacultyRecord[] = [
        { id: `cse-f-${year}`, name: `CSE ${year}`, departmentId: 'cse', specialization: null, courseIds: [] },
        { id: `ece-f-${year}`, name: `ECE ${year}`, departmentId: 'ece', specialization: null, courseIds: [] },
      ];
      for (const branch of ['CSE', 'ECE'] as const) {
        for (const subject of subjects) {
          const shared = subject.title === 'Engineering Mathematics I';
          const title = shared ? subject.title : `${branch} ${subject.title}`;
          courses.push({
            id: `${branch}-${year}-${subject.title}`,
            title,
            credits: subject.credits,
            facultyIds: [branch === 'CSE' ? `cse-f-${year}` : `ece-f-${year}`],
            coordinatorId: branch === 'CSE' ? `cse-f-${year}` : `ece-f-${year}`,
            programIds: [branch],
            departmentId: branch.toLowerCase(),
            category: subject.lab ? 'lab' : 'general',
          });
        }
      }
      const sections: SectionRecord[] = [
        { id: `cse-${year}`, name: `CSE Year ${year}`, programId: 'CSE' },
        { id: `ece-${year}`, name: `ECE Year ${year}`, programId: 'ECE' },
      ];
      const result = settleTimetable({
        courses,
        faculty: facultyRows,
        sections,
        workingDays: DEFAULT_WORKING_DAYS,
        periods: DEFAULT_PERIODS,
        occupied,
      });

      expect(result.warnings.filter((warning) => warning.includes('left unscheduled'))).toEqual([]);
      const titlesInRoom = new Map<string, Set<string>>();
      for (const slot of result.slots) {
        expect(DEFAULT_LECTURE_ROOMS).toContain(slot.room);
        const key = `${slot.dayOfWeek}|${slot.startTime}|${slot.room.toLowerCase()}`;
        const titles = titlesInRoom.get(key) ?? new Set<string>();
        titles.add(slot.courseTitle);
        titlesInRoom.set(key, titles);
        expect(titles.size).toBe(1);
      }
      const atOnce = new Map<string, Set<string>>();
      for (const slot of [...occupied, ...result.slots]) {
        const key = `${slot.dayOfWeek}|${slot.startTime}`;
        const rooms = atOnce.get(key) ?? new Set<string>();
        rooms.add(slot.room.toLowerCase());
        atOnce.set(key, rooms);
        expect(rooms.size).toBeLessThanOrEqual(3);
      }
      occupied = [
        ...occupied,
        ...result.slots.map((slot) => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          facultyId: slot.facultyId,
          room: slot.room,
        })),
      ];
    }
  });
});
