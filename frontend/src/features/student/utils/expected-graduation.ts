export const DEFAULT_PROGRAM_DURATION_YEARS = 4;

export function remainingYearsUntilGraduation(
  programDuration: number,
  yearOfStudy: number,
): number {
  const duration = Math.max(1, programDuration);
  const year = Math.max(1, yearOfStudy);
  if (year <= 1) return duration;
  return Math.max(0, duration - year);
}

export function computeExpectedGraduationDateIso(input: {
  yearOfStudy: number;
  programDuration?: number | null;
  admissionDate?: string | null;
  fromDate?: Date;
}): string {
  const duration = input.programDuration ?? DEFAULT_PROGRAM_DURATION_YEARS;
  const remaining = remainingYearsUntilGraduation(duration, input.yearOfStudy);
  const baseRaw = input.admissionDate?.trim()
    ? input.admissionDate
    : (input.fromDate ?? new Date()).toISOString().slice(0, 10);
  const base = new Date(`${baseRaw}T12:00:00`);
  base.setFullYear(base.getFullYear() + remaining);
  base.setMonth(5, 30);
  return base.toISOString().slice(0, 10);
}
