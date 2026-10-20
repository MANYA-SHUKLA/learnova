import type { AcademicYear, Semester, SemesterTerm } from '@learnova/types';

function parseDay(iso: string): number {
  return new Date(iso.slice(0, 10)).getTime();
}

export function isDateInRange(isoDay: string, start: string, end: string): boolean {
  const t = parseDay(isoDay);
  return t >= parseDay(start) && t <= parseDay(end);
}

export function resolveActiveAcademicYear(
  years: AcademicYear[],
  todayIso = new Date().toISOString().slice(0, 10),
): AcademicYear | null {
  if (!years.length) return null;
  const flagged = years.find((y) => y.isActive && y.status !== 'archived');
  if (flagged) return flagged;
  const byDate = years.find(
    (y) => y.status !== 'archived' && isDateInRange(todayIso, y.startDate, y.endDate),
  );
  return byDate ?? years.find((y) => y.status !== 'archived') ?? null;
}

export function resolveCurrentSemester(
  semesters: Semester[],
  todayIso = new Date().toISOString().slice(0, 10),
): Semester | null {
  const active = semesters.filter((s) => s.status !== 'archived');
  if (!active.length) return null;

  const byDate = active.filter(
    (s) => s.startDate && s.endDate && isDateInRange(todayIso, s.startDate, s.endDate),
  );
  if (byDate.length === 1) return byDate[0]!;
  if (byDate.length > 1) {
    return byDate.sort((a, b) => b.number - a.number)[0]!;
  }

  const statusActive = active.filter((s) => s.status === 'active');
  const pool = statusActive.length ? statusActive : active;
  return pool.sort((a, b) => b.number - a.number)[0] ?? null;
}

export function formatSemesterMonthRange(
  start: string | null,
  end: string | null,
  locale = 'en-IN',
): string | null {
  if (!start || !end) return null;
  const s = new Date(start.slice(0, 10));
  const e = new Date(end.slice(0, 10));
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  const month = (d: Date) => d.toLocaleDateString(locale, { month: 'short' });
  return `${month(s)}–${month(e)}`;
}

const TERM_SEM_LABEL: Record<SemesterTerm, string> = {
  odd: 'Odd sem',
  even: 'Even sem',
  summer: 'Summer sem',
};

/** Human label for odd/even/summer term (fallback when i18n key is missing). */
export function defaultTermSemesterLabel(term: SemesterTerm): string {
  return TERM_SEM_LABEL[term];
}

export function formatTermSemesterLabel(
  term: SemesterTerm,
  translateTerm: (term: SemesterTerm) => string,
): string {
  const translated = translateTerm(term);
  if (!translated || translated.includes('dashboard.institution')) {
    return defaultTermSemesterLabel(term);
  }
  return `${translated} sem`;
}

export function buildAcademicSessionLabel(input: {
  year: AcademicYear | null;
  semester: Semester | null;
  termLabel: string;
  locale?: string;
}): string | null {
  const { year, semester, termLabel, locale } = input;
  if (!year) return null;

  const parts: string[] = [year.name];

  if (semester) {
    const range = formatSemesterMonthRange(semester.startDate, semester.endDate, locale);
    const name = semester.name.trim();
    if (range) parts.push(range);
    else if (name) parts.push(name);
    parts.push(termLabel);
  }

  return parts.join(' · ');
}
