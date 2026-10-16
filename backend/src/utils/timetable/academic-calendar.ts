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
