import type { TimetableDayOfWeek } from '@learnova/types';
import { timesOverlap } from '../../utils/timetable/time.js';
import { JNU_SOE_MONSOON_PERIODS } from './jnu-soe-monsoon-2026.js';

export interface JnuValidationSlot {
  dayOfWeek: TimetableDayOfWeek;
  startTime: string;
  endTime: string;
  facultyId: string;
  facultyName?: string;
  sectionId: string;
  sectionName: string;
  room: string;
  courseTitle?: string;
  courseCode?: string;
}

export interface JnuClashRecord {
  kind: 'faculty' | 'cohort' | 'room' | 'laboratory' | 'lunch' | 'excluded_programme';
  dayOfWeek: TimetableDayOfWeek;
  startTime: string;
  endTime: string;
  detail: string;
}

export interface JnuValidationReport {
  valid: boolean;
  provisional: boolean;
  totalSessionsScheduled: number;
  facultyClashes: JnuClashRecord[];
  cohortClashes: JnuClashRecord[];
  roomClashes: JnuClashRecord[];
  laboratoryClashes: JnuClashRecord[];
  lunchViolations: JnuClashRecord[];
  excludedProgrammeSlots: JnuClashRecord[];
  uncertainties: string[];
  summaryLines: string[];
}

const LUNCH = { startTime: '13:00', endTime: '14:15' };

const EXCLUDED_SECTION = /^(M\.Tech|Ph\.D)\b/i;

function sectionIdsFromName(sectionName: string): string[] {
  return sectionName.split('+').map((s) => s.trim()).filter(Boolean);
}

function overlapsLunch(startTime: string, endTime: string): boolean {
  return timesOverlap(startTime, endTime, LUNCH.startTime, LUNCH.endTime);
}

function isAllowedPeriod(startTime: string, endTime: string): boolean {
  return JNU_SOE_MONSOON_PERIODS.some(
    (p) => p.startTime === startTime && p.endTime === endTime,
  );
}

function isLabRoom(room: string): boolean {
  return /\blab\b/i.test(room);
}

export function validateJnuTimetable(
  slots: JnuValidationSlot[],
  options?: { uncertainties?: string[] },
): JnuValidationReport {
  const facultyClashes: JnuClashRecord[] = [];
  const cohortClashes: JnuClashRecord[] = [];
  const roomClashes: JnuClashRecord[] = [];
  const laboratoryClashes: JnuClashRecord[] = [];
  const lunchViolations: JnuClashRecord[] = [];
  const excludedProgrammeSlots: JnuClashRecord[] = [];
  const uncertainties = [...(options?.uncertainties ?? [])];

  for (const slot of slots) {
    if (overlapsLunch(slot.startTime, slot.endTime)) {
      lunchViolations.push({
        kind: 'lunch',
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        detail: `Class during lunch break: ${slot.sectionName} / ${slot.courseTitle ?? slot.courseCode ?? 'course'}`,
      });
    }
    if (!isAllowedPeriod(slot.startTime, slot.endTime)) {
      uncertainties.push(
        `Slot ${slot.dayOfWeek} ${slot.startTime}-${slot.endTime} is outside the official 8-period grid (${slot.sectionName}).`,
      );
    }
    for (const label of sectionIdsFromName(slot.sectionName)) {
      if (EXCLUDED_SECTION.test(label)) {
        excludedProgrammeSlots.push({
          kind: 'excluded_programme',
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          detail: `Excluded programme section in timetable: ${label}`,
        });
      }
    }
  }

  for (let i = 0; i < slots.length; i += 1) {
    const a = slots[i]!;
    for (let j = i + 1; j < slots.length; j += 1) {
      const b = slots[j]!;
      if (a.dayOfWeek !== b.dayOfWeek) continue;
      if (!timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

      if (a.facultyId === b.facultyId) {
        facultyClashes.push({
          kind: 'faculty',
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          detail: `${a.facultyName ?? a.facultyId}: "${a.courseTitle ?? a.courseCode}" (${a.sectionName}) vs "${b.courseTitle ?? b.courseCode}" (${b.sectionName})`,
        });
      }

      if (a.room.trim().toLowerCase() === b.room.trim().toLowerCase()) {
        const record: JnuClashRecord = {
          kind: 'room',
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          detail: `Room ${a.room}: ${a.sectionName} vs ${b.sectionName}`,
        };
        roomClashes.push(record);
        if (isLabRoom(a.room)) {
          laboratoryClashes.push({ ...record, kind: 'laboratory' });
        }
      }

      if (a.sectionId === b.sectionId) {
        cohortClashes.push({
          kind: 'cohort',
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          detail: `Section ${a.sectionName}: ${a.courseTitle ?? a.courseCode} vs ${b.courseTitle ?? b.courseCode}`,
        });
      }
    }
  }

  const hardCount =
    facultyClashes.length +
    cohortClashes.length +
    roomClashes.length +
    laboratoryClashes.length +
    lunchViolations.length +
    excludedProgrammeSlots.length;

  const valid = hardCount === 0;
  const provisional = !valid || uncertainties.length > 0;

  const summaryLines = [
    `Sessions scheduled: ${slots.length}`,
    `Faculty clashes: ${facultyClashes.length}`,
    `Cohort clashes: ${cohortClashes.length}`,
    `Room clashes: ${roomClashes.length}`,
    `Laboratory clashes: ${laboratoryClashes.length}`,
    `Lunch violations: ${lunchViolations.length}`,
    `Excluded programme slots: ${excludedProgrammeSlots.length}`,
    `Source uncertainties: ${uncertainties.length}`,
    valid ? 'Hard constraints: SATISFIED' : 'Hard constraints: VIOLATED — timetable is PROVISIONAL',
  ];

  return {
    valid,
    provisional,
    totalSessionsScheduled: slots.length,
    facultyClashes,
    cohortClashes,
    roomClashes,
    laboratoryClashes,
    lunchViolations,
    excludedProgrammeSlots,
    uncertainties,
    summaryLines,
  };
}

export function formatValidationReport(report: JnuValidationReport): string {
  return [
    '--- JNU hard-constraint validation ---',
    ...report.summaryLines,
    ...(report.facultyClashes.length
      ? ['Faculty:', ...report.facultyClashes.slice(0, 10).map((c) => `  ${c.dayOfWeek} ${c.startTime} ${c.detail}`)]
      : []),
    ...(report.roomClashes.length
      ? ['Rooms:', ...report.roomClashes.slice(0, 10).map((c) => `  ${c.dayOfWeek} ${c.startTime} ${c.detail}`)]
      : []),
    ...(report.cohortClashes.length
      ? ['Cohorts:', ...report.cohortClashes.slice(0, 10).map((c) => `  ${c.dayOfWeek} ${c.startTime} ${c.detail}`)]
      : []),
    ...(report.uncertainties.length
      ? ['Uncertainties:', ...report.uncertainties.slice(0, 10).map((u) => `  ${u}`)]
      : []),
  ].join('\n');
}
