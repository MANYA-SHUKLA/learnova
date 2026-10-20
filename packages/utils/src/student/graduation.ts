export const DEFAULT_PROGRAM_DURATION_YEARS = 4;

/** Years left until graduation (e.g. 4-yr program, year 1 → 4; year 2 → 2). */
export function remainingYearsUntilGraduation(
  programDuration: number,
  yearOfStudy: number,
): number {
  const duration = Math.max(1, programDuration);
  const year = Math.max(1, yearOfStudy);
  if (year <= 1) return duration;
  return Math.max(0, duration - year);
}

export function computeExpectedGraduationDate(input: {
  yearOfStudy: number;
  programDuration?: number | null;
  admissionDate?: Date | string | null;
  fromDate?: Date;
}): Date {
  const duration = input.programDuration ?? DEFAULT_PROGRAM_DURATION_YEARS;
  const remaining = remainingYearsUntilGraduation(duration, input.yearOfStudy);
  const baseRaw = input.admissionDate ?? input.fromDate ?? new Date();
  const base = baseRaw instanceof Date ? baseRaw : new Date(baseRaw);
  const grad = new Date(base);
  grad.setFullYear(grad.getFullYear() + remaining);
  grad.setMonth(5, 30);
  grad.setHours(12, 0, 0, 0);
  return grad;
}

export function formatExpectedGraduationDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
