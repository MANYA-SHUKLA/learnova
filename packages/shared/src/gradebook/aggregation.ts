import { GRADEBOOK_LETTER_BANDS } from '@learnova/constants';

export interface WeightedGradeRow {
  percentage: number | null;
  weightage: number;
  activityKind?: string;
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

export function letterGradeFromPercentage(percentage: number | null): string | null {
  if (percentage == null) return null;
  for (const band of GRADEBOOK_LETTER_BANDS) {
    if (percentage >= band.min) return band.letter;
  }
  return 'F';
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
