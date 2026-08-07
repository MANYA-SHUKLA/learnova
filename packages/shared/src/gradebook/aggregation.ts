import { GRADE_SCALE_BANDS } from '@learnova/constants';

export interface WeightedGradeRow {
  percentage: number | null;
  weightage: number;
  activityKind?: string;
  metadata?: Record<string, unknown>;
}

export interface GradeScaleBand {
  min: number;
  letter: string;
  points: number;
  result: 'pass' | 'fail';
}

/**
 * Aggregate consumed gradebook entries — weighted average of percentages.
 * Does NOT recalculate marks; only combines already-normalized percentages.
 */
export function aggregateWeightedPercentage(rows: WeightedGradeRow[]): number | null {
  const valid = rows.filter((r) => r.percentage != null && r.weightage > 0);
  if (valid.length === 0) return null;

  const totalWeight = valid.reduce((sum, r) => sum + r.weightage, 0);
  if (totalWeight <= 0) return null;

  const weighted = valid.reduce(
    (sum, r) => sum + (r.percentage as number) * (r.weightage / totalWeight),
    0,
  );
  return Math.round(weighted * 100) / 100;
}

export function resolveGradeScaleBand(
  percentage: number | null,
  bands: readonly GradeScaleBand[] = GRADE_SCALE_BANDS,
): GradeScaleBand | null {
  if (percentage == null) return null;
  for (const band of bands) {
    if (percentage >= band.min) return band;
  }
  return bands[bands.length - 1] ?? null;
}

export function letterGradeFromPercentage(percentage: number | null): string | null {
  return resolveGradeScaleBand(percentage)?.letter ?? null;
}

export function gradePointsFromPercentage(percentage: number | null): number | null {
  const band = resolveGradeScaleBand(percentage);
  return band ? band.points : null;
}

export function resultFromPercentage(
  percentage: number | null,
  passingPercentage = 60,
): 'pass' | 'fail' | 'incomplete' {
  if (percentage == null) return 'incomplete';
  return percentage >= passingPercentage ? 'pass' : 'fail';
}

export function computeSemesterGpa(
  courses: Array<{ gradePoints: number | null; credits: number }>,
): number | null {
  let weighted = 0;
  let credits = 0;
  for (const course of courses) {
    if (course.gradePoints == null || course.credits <= 0) continue;
    weighted += course.gradePoints * course.credits;
    credits += course.credits;
  }
  if (credits <= 0) return null;
  return Math.round((weighted / credits) * 100) / 100;
}

export function computeCgpa(
  semesters: Array<{ semesterGpa: number | null; totalCredits: number }>,
): number | null {
  let weighted = 0;
  let credits = 0;
  for (const semester of semesters) {
    if (semester.semesterGpa == null || semester.totalCredits <= 0) continue;
    weighted += semester.semesterGpa * semester.totalCredits;
    credits += semester.totalCredits;
  }
  if (credits <= 0) return null;
  return Math.round((weighted / credits) * 100) / 100;
}

export function sumMarks(rows: Array<{ marksObtained: number | null; totalMarks: number | null }>): {
  earned: number;
  possible: number;
} {
  let earned = 0;
  let possible = 0;
  for (const row of rows) {
    if (row.marksObtained != null) earned += row.marksObtained;
    if (row.totalMarks != null) possible += row.totalMarks;
  }
  return { earned: Math.round(earned * 100) / 100, possible: Math.round(possible * 100) / 100 };
}

export function gradeDistribution(
  grades: Array<{ letterGrade: string | null }>,
): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const row of grades) {
    const key = row.letterGrade ?? 'N/A';
    dist[key] = (dist[key] ?? 0) + 1;
  }
  return dist;
}
