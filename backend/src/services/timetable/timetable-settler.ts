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

export interface OccupiedSlot {
  dayOfWeek: TimetableDayOfWeek;
  startTime: string;
  endTime: string;
  facultyId: string;
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
  /** Teachers already assigned to the other term (odd vs even). Used only when someone else can teach. */
  avoidFacultyIds?: string[];
  /** Classes already placed in other years of this same term. */
  occupied?: OccupiedSlot[];
}

export interface SettleResult {
  assignments: TeachingAssignment[];
  slots: SettledSlot[];
  warnings: string[];
}

/** SOE JNU campus grid — generation always uses these, not client overrides. */
export const DEFAULT_WORKING_DAYS: TimetableDayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

export const DEFAULT_PERIODS: TimetablePeriod[] = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
  { startTime: '12:00', endTime: '13:00' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:00', endTime: '16:00' },
  { startTime: '16:00', endTime: '17:00' },
  { startTime: '17:00', endTime: '18:00' },
];

/** Three rooms for the whole campus. Theory and lab sessions share them. */
export const CAMPUS_ROOMS = ['ELC Class 1', 'ELC Class 2', 'ELC Class 3'] as const;

export const DEFAULT_LECTURE_ROOMS = CAMPUS_ROOMS;

export const DEFAULT_LAB_ROOMS = CAMPUS_ROOMS;

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

function preferredFacultyId(linked: string[], avoid: Set<string>, preferred?: string | null): string | null {
  const open = linked.filter((id) => !avoid.has(id));
  const pool = open.length > 0 ? open : linked;
  if (preferred && pool.includes(preferred)) return preferred;
  return pool[0] ?? null;
}

export function extractTeachingMap(
  courses: CourseRecord[],
  faculty: FacultyRecord[],
  options?: { avoidFacultyIds?: Set<string> },
): Map<string, string> {
  const facultyIds = new Set(faculty.map((row) => row.id));
  const avoid = options?.avoidFacultyIds ?? new Set<string>();
  const map = new Map<string, string>();

  for (const course of courses) {
    const coordinator =
      course.coordinatorId && facultyIds.has(course.coordinatorId) ? course.coordinatorId : null;
    const linked = course.facultyIds.filter((id) => facultyIds.has(id));
    const pick = preferredFacultyId(linked, avoid, coordinator);
    if (pick) map.set(course.id, pick);
  }

  for (const row of faculty) {
    if (avoid.has(row.id) && faculty.some((other) => other.id !== row.id && !avoid.has(other.id))) {
      continue;
    }
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
  options?: { avoidFacultyIds?: Set<string> },
): Map<string, string> {
  const next = new Map(current);
  const facultyIds = new Set(faculty.map((row) => row.id));
  const avoid = options?.avoidFacultyIds ?? new Set<string>();
  const hasAlternative = faculty.some((row) => !avoid.has(row.id));

  for (const extra of extras ?? []) {
    if (next.has(extra.courseId)) continue;
    if (!courses.some((course) => course.id === extra.courseId)) continue;
    if (!facultyIds.has(extra.facultyId)) continue;
    if (avoid.has(extra.facultyId) && hasAlternative) continue;
    next.set(extra.courseId, extra.facultyId);
  }

  const load = new Map<string, number>();
  for (const facultyId of next.values()) {
    load.set(facultyId, (load.get(facultyId) ?? 0) + 1);
  }

  for (const course of courses) {
    if (next.has(course.id) || faculty.length === 0) continue;
    const ranked = [...faculty].sort((a, b) => {
      const avoidDiff = Number(avoid.has(a.id)) - Number(avoid.has(b.id));
      if (avoidDiff !== 0) return avoidDiff;
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

/** Same subject taught to more than one branch, such as CSE and ECE maths. */
export function sharedCourseKey(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ClassMeeting {
  key: string;
  title: string;
  sessions: number;
  sessionsLeft: number;
  facultyId: string;
  preferLab: boolean;
  members: { courseId: string; sectionId: string }[];
}

function meetingBlocked(
  existing: SettledSlot[],
  occupied: OccupiedSlot[],
  dayOfWeek: TimetableDayOfWeek,
  startTime: string,
  endTime: string,
  facultyId: string,
  room: string,
  sectionIds: string[],
): boolean {
  const sections = new Set(sectionIds);
  const overlapsPlaced = existing.some(
    (slot) =>
      slot.dayOfWeek === dayOfWeek &&
      timesOverlap(slot.startTime, slot.endTime, startTime, endTime) &&
      (sections.has(slot.sectionId) ||
        slot.facultyId === facultyId ||
        slot.room.toLowerCase() === room.toLowerCase()),
  );
  if (overlapsPlaced) return true;
  return occupied.some(
    (slot) =>
      slot.dayOfWeek === dayOfWeek &&
      timesOverlap(slot.startTime, slot.endTime, startTime, endTime) &&
      (slot.facultyId === facultyId || slot.room.toLowerCase() === room.toLowerCase()),
  );
}

function freeRoomCount(
  existing: SettledSlot[],
  occupied: OccupiedSlot[],
  dayOfWeek: TimetableDayOfWeek,
  startTime: string,
  endTime: string,
): number {
  return venuePool(false).filter((room) => {
    const taken =
      existing.some(
        (slot) =>
          slot.dayOfWeek === dayOfWeek &&
          slot.room.toLowerCase() === room.toLowerCase() &&
          timesOverlap(slot.startTime, slot.endTime, startTime, endTime),
      ) ||
      occupied.some(
        (slot) =>
          slot.dayOfWeek === dayOfWeek &&
          slot.room.toLowerCase() === room.toLowerCase() &&
          timesOverlap(slot.startTime, slot.endTime, startTime, endTime),
      );
    return !taken;
  }).length;
}

function chooseMeetingRoom(
  existing: SettledSlot[],
  occupied: OccupiedSlot[],
  dayOfWeek: TimetableDayOfWeek,
  startTime: string,
  endTime: string,
  facultyId: string,
  sectionIds: string[],
  preferLab: boolean,
  proposedRoom?: string,
): string | null {
  const pool = [...venuePool(preferLab)];
  if (proposedRoom && isAllowedVenue(proposedRoom, preferLab)) {
    const index = pool.findIndex((room) => room.toLowerCase() === proposedRoom.toLowerCase());
    if (index > 0) {
      const [preferred] = pool.splice(index, 1);
      if (preferred) pool.unshift(preferred);
    }
  }
  for (const room of pool) {
    if (!meetingBlocked(existing, occupied, dayOfWeek, startTime, endTime, facultyId, room, sectionIds)) {
      return room;
    }
  }
  return null;
}

function preferredMeetingFaculty(votes: string[]): string | null {
  if (votes.length === 0) return null;
  const counts = new Map<string, number>();
  for (const facultyId of votes) {
    counts.set(facultyId, (counts.get(facultyId) ?? 0) + 1);
  }
  let best = votes[0] ?? null;
  let bestCount = best ? (counts.get(best) ?? 0) : 0;
  for (const facultyId of votes) {
    const count = counts.get(facultyId) ?? 0;
    if (count > bestCount) {
      best = facultyId;
      bestCount = count;
    }
  }
  return best;
}

export function isLabCourse(course: Pick<CourseRecord, 'title' | 'category'>): boolean {
  const blob = `${course.title} ${course.category ?? ''}`.toLowerCase();
  return /\blab\b|practical|workshop/.test(blob);
}

function venuePool(preferLab: boolean): readonly string[] {
  return preferLab ? DEFAULT_LAB_ROOMS : DEFAULT_LECTURE_ROOMS;
}

function isAllowedVenue(room: string, preferLab: boolean): boolean {
  const wanted = room.trim().toLowerCase();
  return venuePool(preferLab).some((name) => name.toLowerCase() === wanted);
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
  const avoid = new Set(input.avoidFacultyIds ?? []);
  const occupied = input.occupied ?? [];

  const extracted = extractTeachingMap(input.courses, input.faculty, { avoidFacultyIds: avoid });
  const teachingMap = fillUnassignedFaculty(
    input.courses,
    input.faculty,
    extracted,
    input.geminiAssignments,
    { avoidFacultyIds: avoid },
  );
  const meetings = buildClassMeetings(input.courses, input.sections, teachingMap, sectionById);
  for (const meeting of meetings) {
    if (meeting.members.length < 2) continue;
    for (const member of meeting.members) {
      teachingMap.set(member.courseId, meeting.facultyId);
    }
    const names = meeting.members
      .map((member) => sectionById.get(member.sectionId)?.name)
      .filter((name): name is string => Boolean(name));
    warnings.push(`${meeting.title} is a combined class for ${names.join(' and ')}`);
  }

  const assignments = toAssignments(input.courses, input.faculty, teachingMap);

  for (const course of input.courses) {
    const facultyId = teachingMap.get(course.id);
    if (!facultyId) {
      warnings.push(`No faculty available to teach ${course.title}`);
      continue;
    }
    if (avoid.has(facultyId)) {
      const teacher = facultyById.get(facultyId);
      warnings.push(
        `${teacher ? facultyName(teacher) : 'This teacher'} already teaches the other term, and no other faculty could take ${course.title}`,
      );
    }
  }

  const slots: SettledSlot[] = [];
  const meetingByMember = new Map<string, ClassMeeting>();
  for (const meeting of meetings) {
    for (const member of meeting.members) {
      meetingByMember.set(`${member.courseId}|${member.sectionId}`, meeting);
    }
  }

  const placeMeeting = (
    meeting: ClassMeeting,
    dayOfWeek: TimetableDayOfWeek,
    startTime: string,
    endTime: string,
    room: string,
    repaired: boolean,
  ): boolean => {
    const teacher = facultyById.get(meeting.facultyId);
    if (!teacher || meeting.sessionsLeft <= 0) return false;
    const sectionIds = meeting.members.map((member) => member.sectionId);
    if (meetingBlocked(slots, occupied, dayOfWeek, startTime, endTime, teacher.id, room, sectionIds)) {
      return false;
    }
    const placed: SettledSlot[] = [];
    for (const member of meeting.members) {
      const course = courseById.get(member.courseId);
      const section = sectionById.get(member.sectionId);
      if (!course || !section) return false;
      placed.push({
        dayOfWeek,
        startTime,
        endTime,
        courseId: course.id,
        courseTitle: course.title,
        sectionId: section.id,
        sectionName: section.name,
        facultyId: teacher.id,
        facultyName: facultyName(teacher),
        room,
      });
    }
    slots.push(...placed);
    meeting.sessionsLeft -= 1;
    if (repaired) {
      const sectionLabel = meeting.members
        .map((member) => sectionById.get(member.sectionId)?.name)
        .filter(Boolean)
        .join(' + ');
      warnings.push(`Repaired overlap for ${meeting.title} / ${sectionLabel} on ${dayOfWeek} ${startTime}`);
    }
    return true;
  };

  for (const proposed of input.proposedSlots ?? []) {
    const meeting = meetingByMember.get(`${proposed.courseId}|${proposed.sectionId}`);
    if (!meeting || meeting.sessionsLeft <= 0) continue;
    if (!workingDays.includes(proposed.dayOfWeek)) continue;
    const room = chooseMeetingRoom(
      slots,
      occupied,
      proposed.dayOfWeek,
      proposed.startTime,
      proposed.endTime,
      meeting.facultyId,
      meeting.members.map((member) => member.sectionId),
      meeting.preferLab,
      proposed.room,
    );
    if (!room) continue;
    const proposedRoom = proposed.room;
    const repaired = typeof proposedRoom === 'string' && room.toLowerCase() !== proposedRoom.toLowerCase();
    placeMeeting(meeting, proposed.dayOfWeek, proposed.startTime, proposed.endTime, room, repaired);
  }

  const pending = [...meetings].sort(
    (a, b) => b.members.length - a.members.length || b.sessions - a.sessions,
  );
  const fillOpenPeriods = (minFreeRooms: number) => {
    for (const day of workingDays) {
      for (const period of periods) {
        if (freeRoomCount(slots, occupied, day, period.startTime, period.endTime) < minFreeRooms) continue;
        for (const meeting of pending) {
          if (meeting.sessionsLeft <= 0) continue;
          const sectionIds = meeting.members.map((member) => member.sectionId);
          const room = chooseMeetingRoom(
            slots,
            occupied,
            day,
            period.startTime,
            period.endTime,
            meeting.facultyId,
            sectionIds,
            meeting.preferLab,
          );
          if (!room) continue;
          placeMeeting(meeting, day, period.startTime, period.endTime, room, false);
        }
      }
    }
  };
  // Keep both branches side by side while two rooms are free, then use leftover rooms.
  fillOpenPeriods(2);
  fillOpenPeriods(1);

  for (const meeting of pending) {
    if (meeting.sessionsLeft <= 0) continue;
    const sectionLabel = meeting.members
      .map((member) => sectionById.get(member.sectionId)?.name)
      .filter(Boolean)
      .join(' + ');
    warnings.push(
      `Could not place all sessions for ${meeting.title} (${sectionLabel}); ${String(meeting.sessionsLeft)} left unscheduled`,
    );
  }

  return { assignments, slots, warnings };
}

function buildClassMeetings(
  courses: CourseRecord[],
  sections: SectionRecord[],
  teachingMap: Map<string, string>,
  sectionById: Map<string, SectionRecord>,
): ClassMeeting[] {
  const grouped = new Map<string, { courseId: string; sectionId: string; facultyId: string }[]>();
  const titles = new Map<string, string>();
  const sessions = new Map<string, number>();
  const labs = new Map<string, boolean>();

  for (const section of sections) {
    const seen = new Set<string>();
    for (const course of courses) {
      if (!coursesForSection(course, section)) continue;
      const facultyId = teachingMap.get(course.id);
      if (!facultyId) continue;
      const key = sharedCourseKey(course.title);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const members = grouped.get(key) ?? [];
      members.push({ courseId: course.id, sectionId: section.id, facultyId });
      grouped.set(key, members);
      if (!titles.has(key)) titles.set(key, course.title);
      sessions.set(key, Math.max(sessions.get(key) ?? 0, sessionsPerWeek(course.credits)));
      labs.set(key, (labs.get(key) ?? false) || isLabCourse(course));
    }
  }

  const meetings: ClassMeeting[] = [];
  for (const [key, members] of grouped) {
    const ordered = [...members].sort((a, b) => {
      const left = sectionById.get(a.sectionId)?.name ?? a.sectionId;
      const right = sectionById.get(b.sectionId)?.name ?? b.sectionId;
      return left.localeCompare(right);
    });
    const facultyId = preferredMeetingFaculty(ordered.map((member) => member.facultyId));
    const sessionCount = sessions.get(key) ?? 0;
    if (!facultyId || sessionCount <= 0) continue;
    meetings.push({
      key,
      title: titles.get(key) ?? key,
      sessions: sessionCount,
      sessionsLeft: sessionCount,
      facultyId,
      preferLab: labs.get(key) ?? false,
      members: ordered.map((member) => ({ courseId: member.courseId, sectionId: member.sectionId })),
    });
  }
  return meetings;
}
