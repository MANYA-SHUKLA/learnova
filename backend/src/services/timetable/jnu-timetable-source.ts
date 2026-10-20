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
import type {
  CourseRecord,
  FacultyRecord,
  ProposedSlot,
  SectionRecord,
  SettledSlot,
  TeachingAssignment,
} from './timetable-settler.js';
import type { TimetableDayOfWeek } from '@learnova/types';
import { JNU_BTECH_PROGRESSION_SEMESTERS } from './jnu-master-instructions.js';
import {
  isCrossBranchPhysicsPair,
  isSharedCourseCode,
  sharedSubjectsSummaryForSemester,
} from './jnu-soe-monsoon-2026.js';

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

const PHYSICS_CODE_ALIAS = new Set(['EN201', 'EN201N']);

function findCourseForOfficialRow(
  section: SectionRecord,
  courseCode: string,
  courses: CourseRecord[],
  semesterNumber: number,
): CourseRecord | undefined {
  const normalized = courseCodeFromKey(courseCode);
  const forProgram = (code: string) =>
    courses.find((c) => {
      if ((c.courseCode ?? '').toUpperCase() !== code) return false;
      return c.programIds.length === 0 || c.programIds.includes(section.programId);
    });

  const direct = forProgram(normalized);
  if (direct) return direct;

  if (isSharedCourseCode(semesterNumber, normalized)) {
    const shared = courses.find((c) => (c.courseCode ?? '').toUpperCase() === normalized);
    if (shared) return shared;
  }

  if (PHYSICS_CODE_ALIAS.has(normalized)) {
    for (const alt of PHYSICS_CODE_ALIAS) {
      if (alt === normalized) continue;
      const match = forProgram(alt);
      if (match) return match;
    }
    const physicsShared = courses.find((c) => PHYSICS_CODE_ALIAS.has((c.courseCode ?? '').toUpperCase()));
    if (physicsShared) return physicsShared;
  }

  return courses.find(
    (c) =>
      (c.courseCode ?? '').toUpperCase() === normalized &&
      c.programIds.includes(section.programId),
  );
}

function courseCodeFromKey(courseKey: string): string {
  const base = courseKey.replace(/\s*\(.*\)$/, '').replace(/\s*—.*$/, '').trim();
  const token = base.split(/\s+/)[0] ?? courseKey;
  return token.toUpperCase();
}

function courseCodeFromSlotTitle(courseTitle: string): string {
  const match = courseTitle.match(/^([A-Z0-9]+):/);
  return match?.[1]?.toUpperCase() ?? '';
}

function sectionsCombinedLabel(labels: string[]): string {
  const unique = [...new Set(labels.map((s) => s.trim()).filter(Boolean))];
  unique.sort();
  return unique.join(' + ');
}

/** Same clock time + room + faculty for shared CSE/ECE subjects → one combined class label on each row. */
function applySharedConcurrentLabels(semesterNumber: number, slots: SettledSlot[]): void {
  const byConcurrent = new Map<string, SettledSlot[]>();
  for (const slot of slots) {
    const key = `${slot.dayOfWeek}|${slot.startTime}|${slot.endTime}|${slot.facultyId}|${slot.room.trim().toLowerCase()}`;
    const list = byConcurrent.get(key) ?? [];
    list.push(slot);
    byConcurrent.set(key, list);
  }

  for (const group of byConcurrent.values()) {
    if (group.length < 2) continue;
    const codes = group.map((s) => courseCodeFromSlotTitle(s.courseTitle));
    const physicsPair =
      group.length === 2 && codes[0] && codes[1] && isCrossBranchPhysicsPair(codes[0], codes[1]);
    const allShared =
      physicsPair || codes.every((code) => isSharedCourseCode(semesterNumber, code));
    if (!allShared) continue;

    const hasCse = group.some((s) => s.sectionName.includes('B.Tech CSE'));
    const hasEce = group.some((s) => s.sectionName.includes('B.Tech ECE'));
    if (!hasCse || !hasEce) continue;

    const csePart =
      group.find((s) => s.sectionName.includes('B.Tech CSE'))?.sectionName.split(' + ')[0]?.trim() ??
      '';
    const ecePart =
      group.find((s) => s.sectionName.includes('B.Tech ECE'))?.sectionName.split(' + ')[0]?.trim() ??
      '';
    const combined = sectionsCombinedLabel([csePart, ecePart].filter(Boolean));
    if (!combined) continue;
    for (const slot of group) {
      slot.sectionName = combined;
    }
  }
}

function slotCountBySectionPrefix(slots: SettledSlot[], prefix: 'CSE' | 'ECE'): number {
  let count = 0;
  for (const slot of slots) {
    const parts = slot.sectionName.split('+').map((s) => s.trim());
    for (const part of parts) {
      if (part.includes(`B.Tech ${prefix} Sem`)) count += 1;
    }
  }
  return count;
}

function matchFacultyId(faculty: FacultyRecord[], facultyCode: string, facultyName: string): string | null {
  const meta = FACULTY_BY_CODE[facultyCode];
  const needles = [facultyName, meta?.fullName]
    .filter((n): n is string => Boolean(n))
    .map(normalizeName);
  for (const row of faculty) {
    const hay = normalizeName(row.name);
    if (needles.some((n) => hay.includes(n.split(' ')[0] ?? '') || n.includes(hay))) {
      return row.id;
    }
  }
  return null;
}

/** Map official locked grid rows to settler proposed slots (course/section/faculty ids from LMS). */
function facultyDisplayName(facultyById: Map<string, FacultyRecord>, facultyId: string): string {
  return facultyById.get(facultyId)?.name ?? facultyId;
}

/** Official Monsoon grid → DB slots (merged CSE+ECE rows like monsoon seed). */
export function buildOfficialSettledSlots(
  semesterNumber: number,
  courses: CourseRecord[],
  sections: SectionRecord[],
  faculty: FacultyRecord[],
): {
  slots: SettledSlot[];
  warnings: string[];
  mappedCount: number;
  lockedCount: number;
  cseSlotCount: number;
  eceSlotCount: number;
} {
  const locked = officialLockedSlotsForSemester(semesterNumber);
  const facultyById = new Map(faculty.map((row) => [row.id, row]));
  const warnings: string[] = [];
  const slotDocs: SettledSlot[] = [];
  let mappedCount = 0;

  for (const row of locked) {
    const section = sections.find((s) => s.name === row.sourceSectionLabel);
    if (!section) {
      warnings.push(`No section "${row.sourceSectionLabel}" — skipped ${row.courseKey}.`);
      continue;
    }
    const course = findCourseForOfficialRow(section, row.courseCode, courses, semesterNumber);
    const facultyId = matchFacultyId(faculty, row.facultyCode, row.facultyName);
    if (!course || !facultyId) {
      warnings.push(
        `Could not map ${row.courseKey} (${row.sourceSectionLabel}) — check course code and faculty in LMS.`,
      );
      continue;
    }
    mappedCount += 1;

    const courseTitle = `${row.courseCode}: ${row.subject}`;
    const mergeKey = `${row.dayOfWeek}|${row.startTime}|${row.endTime}|${facultyId}|${course.id}|${row.room.trim().toLowerCase()}`;
    const existing = slotDocs.find(
      (slot) =>
        `${slot.dayOfWeek}|${slot.startTime}|${slot.endTime}|${slot.facultyId}|${slot.courseId}|${slot.room.trim().toLowerCase()}` ===
        mergeKey,
    );
    if (existing) {
      if (existing.sectionId === section.id) {
        continue;
      }
      const combined = sectionsCombinedLabel([
        ...existing.sectionName.split(' + '),
        row.sourceSectionLabel,
      ]);
      existing.sectionName = combined;
      slotDocs.push({
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        courseId: course.id,
        courseTitle,
        sectionId: section.id,
        sectionName: combined,
        facultyId,
        facultyName: facultyDisplayName(facultyById, facultyId),
        room: row.room,
      });
      continue;
    }

    slotDocs.push({
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      courseId: course.id,
      courseTitle,
      sectionId: section.id,
      sectionName: row.sourceSectionLabel,
      facultyId,
      facultyName: facultyDisplayName(facultyById, facultyId),
      room: row.room,
    });
  }

  applySharedConcurrentLabels(semesterNumber, slotDocs);

  const cseSlotCount = slotCountBySectionPrefix(slotDocs, 'CSE');
  const eceSlotCount = slotCountBySectionPrefix(slotDocs, 'ECE');
  const gap = Math.abs(cseSlotCount - eceSlotCount);
  if (cseSlotCount > 0 && eceSlotCount > 0 && gap > 4) {
    warnings.push(
      `CSE/ECE slot count uneven (${cseSlotCount} CSE vs ${eceSlotCount} ECE). Official source expects similar weekly load; re-run Monsoon seed if ECE rows are missing.`,
    );
  }

  const sharedSummary = sharedSubjectsSummaryForSemester(semesterNumber);
  const sharedCodes = [
    ...sharedSummary.shared.map((r) => r.code),
    ...(sharedSummary.crossBranchPhysics
      ? [sharedSummary.crossBranchPhysics.cseCode, sharedSummary.crossBranchPhysics.eceCode]
      : []),
  ];
  if (sharedCodes.length > 0) {
    warnings.push(
      `Shared CSE+ECE this semester: ${[...new Set(sharedCodes)].join(', ')} — scheduled at the same time/room when the official grid matches.`,
    );
  }

  return {
    slots: slotDocs,
    warnings,
    mappedCount,
    lockedCount: locked.length,
    cseSlotCount,
    eceSlotCount,
  };
}

export function teachingAssignmentsFromSettledSlots(
  slots: SettledSlot[],
  courses: CourseRecord[],
): TeachingAssignment[] {
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const seen = new Map<string, TeachingAssignment>();
  for (const slot of slots) {
    const key = slot.courseId;
    const existing = seen.get(key);
    if (existing) {
      existing.sessionsPerWeek += 1;
      continue;
    }
    const course = courseById.get(slot.courseId);
    seen.set(key, {
      courseId: slot.courseId,
      courseTitle: course?.title ?? slot.courseTitle,
      facultyId: slot.facultyId,
      facultyName: slot.facultyName,
      sessionsPerWeek: 1,
    });
  }
  return [...seen.values()];
}

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
    if (!section) continue;
    const course = findCourseForOfficialRow(section, row.courseCode, courses, semesterNumber);
    const facultyId = matchFacultyId(faculty, row.facultyCode, row.facultyName);
    if (!course || !facultyId) continue;

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
