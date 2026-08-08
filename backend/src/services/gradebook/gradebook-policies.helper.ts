import type { Types } from 'mongoose';
import type { GradebookAttemptPolicy, GradeReplacementPolicy } from '@learnova/types';
import {
  DEFAULT_ACADEMIC_POLICY,
  type AcademicPolicyConfig,
  letterGradeFromRelativeRank,
  selectGradeByReplacementPolicy,
} from '@learnova/shared';
import { GradebookAcademicPolicyModel } from '../../models/gradebook-academic-policy.model.js';
import { pickAttemptByPolicy, oid, type ScoredAttemptRow } from './gradebook.helpers.js';

export interface PolicyEntryRow {
  _id: Types.ObjectId;
  activityKind: string;
  activityId: Types.ObjectId;
  activityTitle: string;
  sourceRefId: Types.ObjectId;
  percentage: number | null;
  marksObtained: number | null;
  totalMarks: number | null;
  weightage: number;
  status: string;
  consumedAt: Date;
  metadata: Record<string, unknown>;
}

function purposeOf(entry: PolicyEntryRow): string {
  const purpose = entry.metadata.assessmentPurpose;
  if (typeof purpose === 'string') return purpose;
  const examType = entry.metadata.examType;
  if (examType === 'supplementary') return 'supplementary';
  if (examType === 'improvement' || examType === 'mock') return 'improvement';
  return 'regular';
}

function pickWithinPurpose(
  rows: PolicyEntryRow[],
  policy: GradebookAttemptPolicy,
): PolicyEntryRow | null {
  if (rows.length === 0) return null;
  const scored: ScoredAttemptRow[] = rows.map((row) => ({
    sourceRefId: row.sourceRefId,
    percentage: row.percentage ?? 0,
    score: row.marksObtained ?? 0,
    createdAt: row.consumedAt,
  }));
  const picked = pickAttemptByPolicy(scored, policy);
  if (!picked) return rows[0] ?? null;
  return rows.find((row) => String(row.sourceRefId) === String(picked.sourceRefId)) ?? rows[0] ?? null;
}

export function collapseExamEntriesForPolicy(
  entries: PolicyEntryRow[],
  policy: Pick<
    AcademicPolicyConfig,
    'gradeReplacementPolicy' | 'makeupAttemptPolicy' | 'improvementAttemptPolicy'
  > = DEFAULT_ACADEMIC_POLICY,
): PolicyEntryRow[] {
  const nonExam = entries.filter((entry) => entry.activityKind !== 'exam');
  const examGroups = new Map<string, PolicyEntryRow[]>();

  for (const entry of entries) {
    if (entry.activityKind !== 'exam') continue;
    const key = String(entry.activityId);
    const list = examGroups.get(key) ?? [];
    list.push(entry);
    examGroups.set(key, list);
  }

  const collapsed: PolicyEntryRow[] = [...nonExam];
  for (const group of examGroups.values()) {
    const regular = group.filter((row) => purposeOf(row) === 'regular');
    const supplementary = group.filter((row) => purposeOf(row) === 'supplementary');
    const improvement = group.filter((row) => purposeOf(row) === 'improvement');

    const candidates: PolicyEntryRow[] = [];
    if (regular.length > 0) candidates.push(regular[0]!);
    const makeup = pickWithinPurpose(supplementary, policy.makeupAttemptPolicy);
    if (makeup) candidates.push(makeup);
    const improved = pickWithinPurpose(improvement, policy.improvementAttemptPolicy);
    if (improved) candidates.push(improved);

    const selected = selectGradeByReplacementPolicy(
      candidates.map((row) => ({
        percentage: row.percentage,
        consumedAt: row.consumedAt,
        sourceRefId: String(row.sourceRefId),
        assessmentPurpose: purposeOf(row),
      })),
      policy.gradeReplacementPolicy as GradeReplacementPolicy,
    );

    if (selected) {
      const entry =
        candidates.find((row) => String(row.sourceRefId) === selected.sourceRefId) ??
        candidates[0];
      if (entry) collapsed.push(entry);
    } else if (candidates[0]) {
      collapsed.push(candidates[0]);
    }
  }

  return collapsed;
}

export function applyRelativeLetterGrades(
  rows: Array<{ studentId: string; weightedPercentage: number | null; letterGrade: string | null }>,
): Map<string, string | null> {
  const ranked = rows
    .filter((row) => row.weightedPercentage != null)
    .sort((a, b) => (b.weightedPercentage ?? 0) - (a.weightedPercentage ?? 0));

  const out = new Map<string, string | null>();
  const total = ranked.length;
  for (let index = 0; index < ranked.length; index += 1) {
    const row = ranked[index]!;
    const percentile = total <= 1 ? 100 : (index / (total - 1)) * 100;
    out.set(row.studentId, letterGradeFromRelativeRank(percentile));
  }

  for (const row of rows) {
    if (!out.has(row.studentId)) {
      out.set(row.studentId, row.letterGrade);
    }
  }

  return out;
}

export function policyConfigFromDoc(
  doc: Record<string, unknown> | null | undefined,
): AcademicPolicyConfig {
  if (!doc) return DEFAULT_ACADEMIC_POLICY;
  const thresholds = doc.standingThresholds as Record<string, unknown> | undefined;
  return {
    creditBasedGrading: Boolean(doc.creditBasedGrading ?? DEFAULT_ACADEMIC_POLICY.creditBasedGrading),
    passingCriteria:
      (doc.passingCriteria as AcademicPolicyConfig['passingCriteria']) ??
      DEFAULT_ACADEMIC_POLICY.passingCriteria,
    passingPercentage:
      (doc.passingPercentage as number) ?? DEFAULT_ACADEMIC_POLICY.passingPercentage,
    passingGradeLetters:
      (doc.passingGradeLetters as string[]) ?? DEFAULT_ACADEMIC_POLICY.passingGradeLetters,
    gradingScheme:
      (doc.gradingScheme as AcademicPolicyConfig['gradingScheme']) ??
      DEFAULT_ACADEMIC_POLICY.gradingScheme,
    gpaFormula:
      (doc.gpaFormula as AcademicPolicyConfig['gpaFormula']) ?? DEFAULT_ACADEMIC_POLICY.gpaFormula,
    cgpaFormula:
      (doc.cgpaFormula as AcademicPolicyConfig['cgpaFormula']) ??
      DEFAULT_ACADEMIC_POLICY.cgpaFormula,
    gradeReplacementPolicy:
      (doc.gradeReplacementPolicy as AcademicPolicyConfig['gradeReplacementPolicy']) ??
      DEFAULT_ACADEMIC_POLICY.gradeReplacementPolicy,
    makeupAttemptPolicy:
      (doc.makeupAttemptPolicy as AcademicPolicyConfig['makeupAttemptPolicy']) ??
      DEFAULT_ACADEMIC_POLICY.makeupAttemptPolicy,
    improvementAttemptPolicy:
      (doc.improvementAttemptPolicy as AcademicPolicyConfig['improvementAttemptPolicy']) ??
      DEFAULT_ACADEMIC_POLICY.improvementAttemptPolicy,
  };
}

export async function loadInstitutionPolicy(institutionId: string) {
  return GradebookAcademicPolicyModel.findOne({ institutionId: oid(institutionId) }).lean().exec();
}
