/**
 * Official Monsoon 2026 B.Tech source → structured scheduling database (no LMS ids).
 */

import {
  COURSE_TITLES,
  FACULTY_BY_CODE,
  MONSOON_PERIODS,
  type RawSlot,
} from '../../seeds/monsoon-2026/constants.js';
import type { SectionPlan } from '../../seeds/monsoon-2026/constants.js';
import { BTECH_SECTION_PLANS } from '../../seeds/monsoon-2026/schedules.js';
import type { ProposedSlot } from './timetable-settler.js';
import type { CourseRecord, FacultyRecord, SectionRecord } from './timetable-settler.js';
import type { TimetableDayOfWeek } from '@learnova/types';
import { JNU_BTECH_PROGRESSION_SEMESTERS } from './jnu-master-instructions.js';

export type JnuActivityType = 'lecture' | 'tutorial' | 'lab';

export interface JnuCourseRecord {
  courseCode: string;
  courseKey: string;
  subject: string;
  programme: 'B.Tech CSE' | 'B.Tech ECE';
  semesterNumber: number;
  facultyCode: string;
  facultyName: string;
  activityType: JnuActivityType;
  group: string | null;
  room: string;
  dayOfWeek: TimetableDayOfWeek;
  periodIndex: number;
  startTime: string;
  endTime: string;
  locked: true;
  sourceSectionLabel: string;
}

export interface JnuFacultySourceRecord {
  facultyCode: string;
  fullName: string;
  courseCodes: Set<string>;
  lockedSlotCount: number;
}

export interface JnuRoomSourceRecord {
  room: string;
  slotCount: number;
  isLaboratory: boolean;
}

export interface JnuLabGroupRecord {
  courseCode: string;
  group: string;
  programme: string;
  semesterNumber: number;
  facultyName: string;
  laboratory: string;
  dayOfWeek: TimetableDayOfWeek;
  startTime: string;
  endTime: string;
}

export interface JnuSourceDatabase {
  courses: JnuCourseRecord[];
  faculty: JnuFacultySourceRecord[];
  rooms: JnuRoomSourceRecord[];
  labGroups: JnuLabGroupRecord[];
  uncertainties: string[];
}

function programmeFromPlan(plan: SectionPlan): 'B.Tech CSE' | 'B.Tech ECE' {
  return plan.programCode === 'BT-CSE' ? 'B.Tech CSE' : 'B.Tech ECE';
}

export function courseCodeFromSlotKey(key: string): string {
  const base = key.replace(/\s*\(.*\)$/, '').replace(/\s*—.*$/, '').trim();
  return (base.split(/\s+/)[0] ?? key).toUpperCase();
}

export function activityTypeFromSlotKey(key: string): JnuActivityType {
  const lower = key.toLowerCase();
  if (lower.includes('lab')) return 'lab';
  if (lower.includes('tut')) return 'tutorial';
  return 'lecture';
}

export function groupFromSlotKey(key: string): string | null {
  const match = key.match(/G-\s*(I+|II|III|IV|\d+)/i);
  if (!match) return null;
  return match[0].replace(/\s+/g, ' ').trim();
}

function isLabRoom(room: string): boolean {
  return /\blab\b/i.test(room);
}

export function buildJnuSourceDatabase(): JnuSourceDatabase {
  const courses: JnuCourseRecord[] = [];
  const facultyMap = new Map<string, JnuFacultySourceRecord>();
  const roomMap = new Map<string, JnuRoomSourceRecord>();
  const labGroups: JnuLabGroupRecord[] = [];
  const uncertainties: string[] = [];

  for (const plan of BTECH_SECTION_PLANS) {
    if (!JNU_BTECH_PROGRESSION_SEMESTERS.includes(plan.semesterNumber as (typeof JNU_BTECH_PROGRESSION_SEMESTERS)[number])) {
      continue;
    }
    const programme = programmeFromPlan(plan);
    for (const entry of plan.slots) {
      const [day, periodIndex, courseKey, facultyCode, room] = entry as RawSlot;
      const period = MONSOON_PERIODS[periodIndex];
      if (!period) {
        uncertainties.push(`Unknown period index ${periodIndex} for ${courseKey} (${plan.sectionLabel})`);
        continue;
      }
      const meta = FACULTY_BY_CODE[facultyCode];
      if (!meta) {
        uncertainties.push(`Unknown faculty code "${facultyCode}" for ${courseKey} (${plan.sectionLabel})`);
      }
      const courseCode = courseCodeFromSlotKey(courseKey);
      const subject = COURSE_TITLES[courseKey] ?? courseKey;
      const activityType = activityTypeFromSlotKey(courseKey);
      const group = groupFromSlotKey(courseKey);

      courses.push({
        courseCode,
        courseKey,
        subject,
        programme,
        semesterNumber: plan.semesterNumber,
        facultyCode,
        facultyName: meta?.fullName ?? 'UNKNOWN',
        activityType,
        group,
        room,
        dayOfWeek: day,
        periodIndex,
        startTime: period.startTime,
        endTime: period.endTime,
        locked: true,
        sourceSectionLabel: plan.sectionLabel,
      });

      if (meta) {
        const existing = facultyMap.get(facultyCode) ?? {
          facultyCode,
          fullName: meta.fullName,
          courseCodes: new Set<string>(),
          lockedSlotCount: 0,
        };
        existing.courseCodes.add(courseCode);
        existing.lockedSlotCount += 1;
        facultyMap.set(facultyCode, existing);
      }

      const roomKey = room.trim();
      const roomRow = roomMap.get(roomKey) ?? {
        room: roomKey,
        slotCount: 0,
        isLaboratory: isLabRoom(roomKey),
      };
      roomRow.slotCount += 1;
      roomMap.set(roomKey, roomRow);

      if (activityType === 'lab' && group) {
        labGroups.push({
          courseCode,
          group,
          programme,
          semesterNumber: plan.semesterNumber,
          facultyName: meta?.fullName ?? 'UNKNOWN',
          laboratory: roomKey,
          dayOfWeek: day,
          startTime: period.startTime,
          endTime: period.endTime,
        });
      }
    }
  }

  return {
    courses,
    faculty: [...facultyMap.values()],
    rooms: [...roomMap.values()],
    labGroups,
    uncertainties,
  };
}

export function officialLockedSlotsForSemester(semesterNumber: number): JnuCourseRecord[] {
  return buildJnuSourceDatabase().courses.filter((row) => row.semesterNumber === semesterNumber);
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function matchFacultyId(faculty: FacultyRecord[], facultyCode: string, facultyName: string): string | null {
  const meta = FACULTY_BY_CODE[facultyCode];
  const needles = [facultyName, meta?.fullName].filter(Boolean).map(normalizeName);
  for (const row of faculty) {
    const hay = normalizeName(row.name);
    if (needles.some((n) => hay.includes(n.split(' ')[0] ?? '') || n.includes(hay))) {
      return row.id;
    }
  }
  return null;
}

/** Map official locked grid rows to settler proposed slots (course/section/faculty ids from LMS). */
export function mapOfficialSlotsToProposed(
  semesterNumber: number,
  courses: CourseRecord[],
  sections: SectionRecord[],
  faculty: FacultyRecord[],
): ProposedSlot[] {
  const locked = officialLockedSlotsForSemester(semesterNumber);
  const proposed: ProposedSlot[] = [];

  for (const row of locked) {
    const section = sections.find((s) => s.name === row.sourceSectionLabel);
    const course = courses.find((c) => {
      if ((c.courseCode ?? '').toUpperCase() !== row.courseCode) return false;
      return c.programIds.length === 0 || c.programIds.includes(section.programId);
    });
    const facultyId = matchFacultyId(faculty, row.facultyCode, row.facultyName);
    if (!section || !course || !facultyId) continue;

    proposed.push({
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      courseId: course.id,
      sectionId: section.id,
      facultyId,
      room: row.room,
    });
  }

  return proposed;
}

export function sourceDatabaseSummaryForSemester(semesterNumber: number): string {
  const db = buildJnuSourceDatabase();
  const locked = db.courses.filter((row) => row.semesterNumber === semesterNumber);
  const catalogue = locked.reduce<
    Record<string, { subject: string; programme: string; faculty: string; activities: string[] }>
  >((acc, row) => {
    const key = `${row.programme}|${row.courseCode}`;
    const entry = acc[key] ?? {
      subject: row.subject,
      programme: row.programme,
      faculty: row.facultyName,
      activities: [],
    };
    entry.activities.push(`${row.activityType} ${row.dayOfWeek} ${row.startTime} ${row.room}${row.group ? ` ${row.group}` : ''}`);
    acc[key] = entry;
    return acc;
  }, {});

  return JSON.stringify(
    {
      semesterNumber,
      lockedOfficialAssignments: locked.length,
      courseCatalogue: catalogue,
      labGroups: db.labGroups.filter((g) => g.semesterNumber === semesterNumber),
      uncertainties: db.uncertainties,
    },
    null,
    2,
  );
}
