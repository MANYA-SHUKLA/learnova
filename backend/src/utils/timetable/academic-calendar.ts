/**
 * SOE calendar.
 * Class years are 1–4. Only one term runs at a time:
 * odd semesters (1, 3, 5, 7) in July–December, even semesters (2, 4, 6, 8) in January–May.
 */

export const CLASS_YEARS = [1, 2, 3, 4] as const;

export type SemesterTerm = 'odd' | 'even';

export function classYearForSemesterNumber(number: number): number {
  if (!Number.isFinite(number) || number < 1) return 1;
  return Math.min(4, Math.ceil(number / 2));
}

export function termForSemesterNumber(number: number): SemesterTerm {
  return number % 2 === 1 ? 'odd' : 'even';
}

export function semesterNumberFor(classYear: number, term: SemesterTerm): number {
  const year = Math.min(4, Math.max(1, Math.round(classYear)));
  return (year - 1) * 2 + (term === 'odd' ? 1 : 2);
}

export function oppositeTerm(term: string): SemesterTerm | null {
  if (term === 'odd') return 'even';
  if (term === 'even') return 'odd';
  return null;
}

/** Odd: 1 July–31 December of `year`. Even: 1 January–31 May of `year`. */
export function semesterDateRange(year: number, term: SemesterTerm): { startDate: Date; endDate: Date } {
  if (term === 'odd') {
    return {
      startDate: new Date(Date.UTC(year, 6, 1)),
      endDate: new Date(Date.UTC(year, 11, 31)),
    };
  }
  return {
    startDate: new Date(Date.UTC(year, 0, 1)),
    endDate: new Date(Date.UTC(year, 4, 31)),
  };
}

export function semesterWindowLabel(term: string): string {
  if (term === 'odd') return 'July–December';
  if (term === 'even') return 'January–May';
  return term;
}

const CALENDAR_TIME_ZONE = 'Asia/Kolkata';

export function calendarParts(
  date: Date,
  timeZone = CALENDAR_TIME_ZONE,
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read('year'), month: read('month'), day: read('day') };
}

/**
 * July–December is the odd term (Year 1 → Sem 1, Year 2 → Sem 3, …).
 * January–June is the even term (Year 1 → Sem 2, Year 2 → Sem 4, …).
 * June stays on the even term until the odd term opens on 1 July.
 */
export function termForDate(date: Date, timeZone = CALENDAR_TIME_ZONE): SemesterTerm {
  return calendarParts(date, timeZone).month >= 7 ? 'odd' : 'even';
}

export function termWindowsForDate(
  date: Date,
  timeZone = CALENDAR_TIME_ZONE,
): { term: SemesterTerm; oddYear: number; evenYear: number } {
  const { year } = calendarParts(date, timeZone);
  const term = termForDate(date, timeZone);
  if (term === 'odd') return { term, oddYear: year, evenYear: year + 1 };
  return { term, oddYear: year - 1, evenYear: year };
}

export function semesterNumberForClassYearOnDate(classYear: number, date: Date): number {
  return semesterNumberFor(classYear, termForDate(date));
}
