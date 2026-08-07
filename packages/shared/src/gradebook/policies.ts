import type { GradeScaleBand } from './aggregation.js';
import { GRADE_SCALE_BANDS } from '@learnova/constants';

export type PassingCriteriaMode = 'marks' | 'grade' | 'both';
export type GradingSchemeMode = 'absolute' | 'relative';
export type GpaFormula = 'credit_weighted' | 'arithmetic_mean' | 'cumulative_credits';
export type GradeReplacementPolicy = 'best' | 'latest' | 'replace_if_higher' | 'keep_original';

export interface AcademicPolicyConfig {
  passingCriteria: PassingCriteriaMode;
  passingPercentage: number;
  passingGradeLetters: string[];
  gradingScheme: GradingSchemeMode;
  gpaFormula: GpaFormula;
  cgpaFormula: GpaFormula;
  gradeReplacementPolicy: GradeReplacementPolicy;
  makeupAttemptPolicy: 'best' | 'latest' | 'average';
  improvementAttemptPolicy: 'best' | 'latest' | 'average';
  creditBasedGrading: boolean;
}

export const DEFAULT_ACADEMIC_POLICY: AcademicPolicyConfig = {
  passingCriteria: 'both',
  passingPercentage: 60,
  passingGradeLetters: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'],
  gradingScheme: 'absolute',
  gpaFormula: 'credit_weighted',
  cgpaFormula: 'credit_weighted',
  gradeReplacementPolicy: 'replace_if_higher',
  makeupAttemptPolicy: 'best',
  improvementAttemptPolicy: 'best',
  creditBasedGrading: true,
};

export interface PassFailEvaluationInput {
  percentage: number | null;
  letterGrade: string | null;
  marksObtained?: number | null;
  totalMarks?: number | null;
  passingMarks?: number | null;
}

export function evaluatePassFail(
  input: PassFailEvaluationInput,
  policy: Pick<
    AcademicPolicyConfig,
    'passingCriteria' | 'passingPercentage' | 'passingGradeLetters'
  > = DEFAULT_ACADEMIC_POLICY,
): 'pass' | 'fail' | 'incomplete' {
  if (input.percentage == null && input.letterGrade == null) return 'incomplete';

  const marksPass =
    input.marksObtained != null &&
    input.totalMarks != null &&
    input.totalMarks > 0 &&
    input.passingMarks != null
      ? input.marksObtained >= input.passingMarks
      : input.percentage != null
        ? input.percentage >= policy.passingPercentage
        : false;

  const gradePass =
    input.letterGrade != null && policy.passingGradeLetters.includes(input.letterGrade);

  switch (policy.passingCriteria) {
    case 'marks':
      return marksPass ? 'pass' : 'fail';
    case 'grade':
      return gradePass ? 'pass' : 'fail';
    case 'both':
      return marksPass && gradePass ? 'pass' : 'fail';
    default:
      return marksPass ? 'pass' : 'fail';
  }
}

export function computeGpaWithFormula(
  courses: Array<{ gradePoints: number | null; credits: number; percentage?: number | null }>,
  formula: GpaFormula = 'credit_weighted',
): number | null {
  const valid = courses.filter((c) => c.gradePoints != null);
  if (valid.length === 0) return null;

  if (formula === 'arithmetic_mean') {
    const sum = valid.reduce((acc, c) => acc + (c.gradePoints as number), 0);
    return Math.round((sum / valid.length) * 100) / 100;
  }

  if (formula === 'cumulative_credits') {
    let points = 0;
    let credits = 0;
    for (const course of valid) {
      const credit = course.credits > 0 ? course.credits : 1;
      points += (course.gradePoints as number) * credit;
      credits += credit;
    }
    return credits > 0 ? Math.round((points / credits) * 100) / 100 : null;
  }

  // credit_weighted (default)
  let weighted = 0;
  let credits = 0;
  for (const course of valid) {
    if (course.credits <= 0) continue;
    weighted += (course.gradePoints as number) * course.credits;
    credits += course.credits;
  }
  return credits > 0 ? Math.round((weighted / credits) * 100) / 100 : null;
}

/** Relative grading: map percentile rank to letter using scale bands bottom-up */
export function letterGradeFromRelativeRank(
  rankPercentile: number,
  bands: readonly GradeScaleBand[] = GRADE_SCALE_BANDS,
): string {
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  const idx = Math.min(
    sorted.length - 1,
    Math.floor(((100 - rankPercentile) / 100) * sorted.length),
  );
  return sorted[idx]?.letter ?? 'F';
}

export interface ReplacementCandidate {
  percentage: number | null;
  consumedAt: string | Date;
  sourceRefId: string;
  assessmentPurpose?: string;
}

export function selectGradeByReplacementPolicy(
  rows: ReplacementCandidate[],
  policy: GradeReplacementPolicy,
): ReplacementCandidate | null {
  if (rows.length === 0) return null;
  if (policy === 'keep_original') {
    return [...rows].sort(
      (a, b) => new Date(a.consumedAt).getTime() - new Date(b.consumedAt).getTime(),
    )[0] ?? null;
  }
  if (policy === 'latest') {
    return [...rows].sort(
      (a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime(),
    )[0] ?? null;
  }
  if (policy === 'replace_if_higher' || policy === 'best') {
    return [...rows].sort(
      (a, b) => (b.percentage ?? 0) - (a.percentage ?? 0),
    )[0] ?? null;
  }
  return rows[0] ?? null;
}

export function resolveAssessmentPurpose(examType?: string): 'regular' | 'supplementary' | 'improvement' {
  if (examType === 'supplementary') return 'supplementary';
  if (examType === 'mock') return 'improvement'; // improvement exams may use mock type in seeds
  return 'regular';
}
