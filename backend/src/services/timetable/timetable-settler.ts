import type { TimetableDayOfWeek } from '@learnova/types';
import { timesOverlap } from '../../utils/timetable/time.js';

export interface TimetablePeriod {
  startTime: string;
  endTime: string;
}

export interface FacultyRecord {
  id: string;
  name: string;
  departmentId: string | null;
  specialization: string | null;
  courseIds: string[];
}

export interface CourseRecord {
  id: string;
  title: string;
  credits: number;
  facultyIds: string[];
  coordinatorId: string | null;
  programIds: string[];
  departmentId: string | null;
  category: string | null;
}

export interface SectionRecord {
  id: string;
  name: string;
  programId: string;
}

export interface TeachingAssignment {
  courseId: string;
  courseTitle: string;
  facultyId: string;
  facultyName: string;
  sessionsPerWeek: number;
}

export interface ProposedSlot {
  dayOfWeek: TimetableDayOfWeek;
  startTime: string;
  endTime: string;
  courseId: string;
  sectionId: string;
  facultyId: string;
  room?: string;
}

export interface SettledSlot {
  dayOfWeek: TimetableDayOfWeek;
  startTime: string;
  endTime: string;
  courseId: string;
  courseTitle: string;
  sectionId: string;
  sectionName: string;
  facultyId: string;
  facultyName: string;
  room: string;
}

export interface SettleInput {
  courses: CourseRecord[];
  faculty: FacultyRecord[];
  sections: SectionRecord[];
  workingDays: TimetableDayOfWeek[];
  periods: TimetablePeriod[];
  geminiAssignments?: Array<{ courseId: string; facultyId: string }>;
  proposedSlots?: ProposedSlot[];
}

export interface SettleResult {
  assignments: TeachingAssignment[];
  slots: SettledSlot[];
  warnings: string[];
}

export const DEFAULT_WORKING_DAYS: TimetableDayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

export const DEFAULT_PERIODS: TimetablePeriod[] = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:15', endTime: '12:15' },
  { startTime: '13:15', endTime: '14:15' },
  { startTime: '14:15', endTime: '15:15' },
];

const DAY_SET = new Set<string>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

export function sessionsPerWeek(credits: number): number {
  const n = Number.isFinite(credits) ? Math.round(credits) : 0;
  return Math.min(4, Math.max(2, n || 2));
}

export function uniqueDays(days: TimetableDayOfWeek[]): TimetableDayOfWeek[] {
  const seen = new Set<TimetableDayOfWeek>();
  const result: TimetableDayOfWeek[] = [];
  for (const day of days) {
    if (!DAY_SET.has(day) || seen.has(day)) continue;
    seen.add(day);
    result.push(day);
  }
  return result;
}

export function normalizeTime(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match?.[1] || !match[2]) return null;
  const next = `${match[1].padStart(2, '0')}:${match[2]}`;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(next) ? next : null;
}

function facultyName(faculty: FacultyRecord): string {
  return faculty.name.trim() || faculty.id;
}

export function extractTeachingMap(
  courses: CourseRecord[],
  faculty: FacultyRecord[],
): Map<string, string> {
  const facultyIds = new Set(faculty.map((row) => row.id));
  const map = new Map<string, string>();

  for (const course of courses) {
    const coordinator =
      course.coordinatorId && facultyIds.has(course.coordinatorId) ? course.coordinatorId : null;
    const linked = course.facultyIds.filter((id) => facultyIds.has(id));
    if (coordinator && linked.includes(coordinator)) {
      map.set(course.id, coordinator);
    } else if (linked[0]) {
      map.set(course.id, linked[0]);
    }
  }

  for (const row of faculty) {
    for (const courseId of row.courseIds) {
      if (!map.has(courseId) && courses.some((course) => course.id === courseId)) {
        map.set(courseId, row.id);
      }
    }
  }

  return map;
}

function scoreFacultyForCourse(course: CourseRecord, faculty: FacultyRecord): number {
  let score = 0;
  if (course.departmentId && faculty.departmentId === course.departmentId) score += 3;
  const haystack = `${course.title} ${course.category ?? ''}`.toLowerCase();
  const spec = faculty.specialization?.toLowerCase().trim();
  if (spec && haystack.includes(spec)) score += 2;
  return score;
}

export function fillUnassignedFaculty(
  courses: CourseRecord[],
  faculty: FacultyRecord[],
  current: Map<string, string>,
  extras?: Array<{ courseId: string; facultyId: string }>,
): Map<string, string> {
  const next = new Map(current);
  const facultyIds = new Set(faculty.map((row) => row.id));

  for (const extra of extras ?? []) {
    if (next.has(extra.courseId)) continue;
    if (!courses.some((course) => course.id === extra.courseId)) continue;
    if (!facultyIds.has(extra.facultyId)) continue;
    next.set(extra.courseId, extra.facultyId);
  }

  const load = new Map<string, number>();
  for (const facultyId of next.values()) {
    load.set(facultyId, (load.get(facultyId) ?? 0) + 1);
  }

  for (const course of courses) {
    if (next.has(course.id) || faculty.length === 0) continue;
    const ranked = [...faculty].sort((a, b) => {
      const scoreDiff = scoreFacultyForCourse(course, b) - scoreFacultyForCourse(course, a);
      if (scoreDiff !== 0) return scoreDiff;
      return (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0);
    });
    const pick = ranked[0];
    if (!pick) continue;
    next.set(course.id, pick.id);
    load.set(pick.id, (load.get(pick.id) ?? 0) + 1);
  }

  return next;
}

export function toAssignments(
  courses: CourseRecord[],
  faculty: FacultyRecord[],
  teachingMap: Map<string, string>,
): TeachingAssignment[] {
  const byFaculty = new Map(faculty.map((row) => [row.id, row]));
  const assignments: TeachingAssignment[] = [];
  for (const course of courses) {
    const facultyId = teachingMap.get(course.id);
    const teacher = facultyId ? byFaculty.get(facultyId) : undefined;
    if (!teacher) continue;
    assignments.push({
      courseId: course.id,
      courseTitle: course.title,
      facultyId: teacher.id,
      facultyName: facultyName(teacher),
      sessionsPerWeek: sessionsPerWeek(course.credits),
    });
  }
  return assignments;
}

function coursesForSection(course: CourseRecord, section: SectionRecord): boolean {
  return course.programIds.length === 0 || course.programIds.includes(section.programId);
}

function slotConflicts(existing: SettledSlot[], candidate: SettledSlot): boolean {
  return existing.some(
    (slot) =>
      slot.dayOfWeek === candidate.dayOfWeek &&
      timesOverlap(slot.startTime, slot.endTime, candidate.startTime, candidate.endTime) &&
      (slot.sectionId === candidate.sectionId ||
        slot.facultyId === candidate.facultyId ||
        slot.room.toLowerCase() === candidate.room.toLowerCase()),
  );
}

function nextRoom(used: SettledSlot[], dayOfWeek: TimetableDayOfWeek, startTime: string, endTime: string): string {
  for (let n = 101; n <= 180; n += 1) {
    const room = `R-${n}`;
    const taken = used.some(
      (slot) =>
        slot.dayOfWeek === dayOfWeek &&
        slot.room.toLowerCase() === room.toLowerCase() &&
        timesOverlap(slot.startTime, slot.endTime, startTime, endTime),
    );
    if (!taken) return room;
  }
  return 'R-101';
}

export function parseGeminiTimetableProposal(raw: unknown): {
  assignments: Array<{ courseId: string; facultyId: string }>;
  slots: ProposedSlot[];
} {
  if (!raw || typeof raw !== 'object') {
    return { assignments: [], slots: [] };
  }
  const data = raw as Record<string, unknown>;
  const assignments: Array<{ courseId: string; facultyId: string }> = [];
  const rawAssignments = Array.isArray(data.assignments) ? data.assignments : [];
  for (const item of rawAssignments) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (typeof row.courseId === 'string' && typeof row.facultyId === 'string') {
      assignments.push({ courseId: row.courseId, facultyId: row.facultyId });
    }
  }

  const slots: ProposedSlot[] = [];
  const rawSlots = Array.isArray(data.slots) ? data.slots : [];
  for (const item of rawSlots) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const day = typeof row.dayOfWeek === 'string' ? row.dayOfWeek : '';
    const startTime = typeof row.startTime === 'string' ? normalizeTime(row.startTime) : null;
    const endTime = typeof row.endTime === 'string' ? normalizeTime(row.endTime) : null;
    if (!DAY_SET.has(day) || !startTime || !endTime || startTime >= endTime) continue;
    if (typeof row.courseId !== 'string' || typeof row.sectionId !== 'string' || typeof row.facultyId !== 'string') {
      continue;
    }
    slots.push({
      dayOfWeek: day as TimetableDayOfWeek,
      startTime,
      endTime,
      courseId: row.courseId,
      sectionId: row.sectionId,
      facultyId: row.facultyId,
      room: typeof row.room === 'string' && row.room.trim() ? row.room.trim() : undefined,
    });
  }

  return { assignments, slots };
}

export function settleTimetable(input: SettleInput): SettleResult {
  const warnings: string[] = [];
  const workingDays = uniqueDays(input.workingDays.length ? input.workingDays : DEFAULT_WORKING_DAYS);
  const periods = input.periods.length ? input.periods : DEFAULT_PERIODS;
  const facultyById = new Map(input.faculty.map((row) => [row.id, row]));
  const courseById = new Map(input.courses.map((row) => [row.id, row]));
  const sectionById = new Map(input.sections.map((row) => [row.id, row]));

  const extracted = extractTeachingMap(input.courses, input.faculty);
  const teachingMap = fillUnassignedFaculty(
    input.courses,
    input.faculty,
    extracted,
    input.geminiAssignments,
  );
  const assignments = toAssignments(input.courses, input.faculty, teachingMap);

  for (const course of input.courses) {
    if (!teachingMap.has(course.id)) {
      warnings.push(`No faculty available to teach ${course.title}`);
    }
  }

  type DemandKey = string;
  const remaining = new Map<DemandKey, number>();
  const demandMeta = new Map<
    DemandKey,
    { courseId: string; sectionId: string; facultyId: string }
  >();

  for (const section of input.sections) {
    for (const course of input.courses) {
      if (!coursesForSection(course, section)) continue;
      const facultyId = teachingMap.get(course.id);
      if (!facultyId) continue;
      const key = `${course.id}|${section.id}`;
      remaining.set(key, sessionsPerWeek(course.credits));
      demandMeta.set(key, { courseId: course.id, sectionId: section.id, facultyId });
    }
  }

  const slots: SettledSlot[] = [];

  const tryPlace = (candidate: SettledSlot, key: DemandKey | null, repaired: boolean): boolean => {
    if (slotConflicts(slots, candidate)) return false;
    slots.push(candidate);
    if (key) {
      const left = (remaining.get(key) ?? 0) - 1;
      if (left <= 0) remaining.delete(key);
      else remaining.set(key, left);
    }
    if (repaired) {
      warnings.push(
        `Repaired overlap for ${candidate.courseTitle} / ${candidate.sectionName} on ${candidate.dayOfWeek} ${candidate.startTime}`,
      );
    }
    return true;
  };

  for (const proposed of input.proposedSlots ?? []) {
    const course = courseById.get(proposed.courseId);
    const section = sectionById.get(proposed.sectionId);
    if (!course || !section || !coursesForSection(course, section)) continue;
    if (!workingDays.includes(proposed.dayOfWeek)) continue;
    const facultyId = teachingMap.get(course.id) ?? proposed.facultyId;
    const teacher = facultyById.get(facultyId);
    if (!teacher) continue;
    const key = `${course.id}|${section.id}`;
    if ((remaining.get(key) ?? 0) <= 0) continue;

    const room =
      proposed.room &&
      !slots.some(
        (slot) =>
          slot.dayOfWeek === proposed.dayOfWeek &&
          slot.room.toLowerCase() === proposed.room!.toLowerCase() &&
          timesOverlap(slot.startTime, slot.endTime, proposed.startTime, proposed.endTime),
      )
        ? proposed.room
        : nextRoom(slots, proposed.dayOfWeek, proposed.startTime, proposed.endTime);

    const candidate: SettledSlot = {
      dayOfWeek: proposed.dayOfWeek,
      startTime: proposed.startTime,
      endTime: proposed.endTime,
      courseId: course.id,
      courseTitle: course.title,
      sectionId: section.id,
      sectionName: section.name,
      facultyId: teacher.id,
      facultyName: facultyName(teacher),
      room,
    };
    tryPlace(candidate, key, room !== (proposed.room ?? room));
  }

  for (const [key, meta] of demandMeta) {
    let left = remaining.get(key) ?? 0;
    if (left <= 0) continue;
    const course = courseById.get(meta.courseId);
    const section = sectionById.get(meta.sectionId);
    const teacher = facultyById.get(meta.facultyId);
    if (!course || !section || !teacher) continue;

    for (const day of workingDays) {
      for (const period of periods) {
        if (left <= 0) break;
        const room = nextRoom(slots, day, period.startTime, period.endTime);
        const candidate: SettledSlot = {
          dayOfWeek: day,
          startTime: period.startTime,
          endTime: period.endTime,
          courseId: course.id,
          courseTitle: course.title,
          sectionId: section.id,
          sectionName: section.name,
          facultyId: teacher.id,
          facultyName: facultyName(teacher),
          room,
        };
        if (tryPlace(candidate, key, false)) {
          left -= 1;
        }
      }
      if (left <= 0) break;
    }

    if ((remaining.get(key) ?? 0) > 0) {
      warnings.push(
        `Could not place all sessions for ${course.title} (${section.name}); ${remaining.get(key)} left unscheduled`,
      );
    }
  }

  return { assignments, slots, warnings };
}
