import type { TimetableDayOfWeek } from '@learnova/types';

const DAY_ORDER: TimetableDayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const WEEKDAY_TO_DAY: Record<string, TimetableDayOfWeek> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

export function dayOfWeekFromDate(date: Date, timeZone: string): TimetableDayOfWeek {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  return WEEKDAY_TO_DAY[weekday] ?? 'mon';
}

export function formatDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = parseTimeToMinutes(startA);
  const aEnd = parseTimeToMinutes(endA);
  const bStart = parseTimeToMinutes(startB);
  const bEnd = parseTimeToMinutes(endB);
  return aStart < bEnd && bStart < aEnd;
}

export function compareDayOfWeek(a: TimetableDayOfWeek, b: TimetableDayOfWeek): number {
  return DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b);
}

export function sortSlotsByDayAndTime<
  T extends { dayOfWeek: TimetableDayOfWeek; startTime: string },
>(slots: T[]): T[] {
  return [...slots].sort((a, b) => {
    const dayDiff = compareDayOfWeek(a.dayOfWeek, b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

/** Milliseconds until the next occurrence of hour:minute in the given IANA timezone. */
export function msUntilNextLocalTime(
  hour: number,
  minute: number,
  timeZone: string,
  from = Date.now(),
): number {
  for (let offsetMin = 1; offsetMin <= 24 * 60 + 1; offsetMin++) {
    const candidate = new Date(from + offsetMin * 60_000);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(candidate);
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    if (h === hour && m === minute) {
      return offsetMin * 60_000;
    }
  }
  return 24 * 60 * 60_000;
}
