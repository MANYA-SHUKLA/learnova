export interface SnapshotGradeSummary {
  percentage: number | null;
  letterGrade: string | null;
  gradePoints: number | null;
  result: string | null;
  finalMarks: number | null;
  totalMarksEarned: number;
  totalMarksPossible: number;
}

export interface SnapshotEntry {
  activityKind: string;
  activityTitle: string;
  percentage: number | null;
  marksObtained: number | null;
  totalMarks: number | null;
  weightage: number;
  assessmentPurpose?: string;
}

export interface GradeSnapshotData {
  version: number;
  summary: SnapshotGradeSummary;
  entries: SnapshotEntry[];
  frozenAt: string;
}

export interface GradeVersionDiff {
  field: string;
  before: unknown;
  after: unknown;
}

export function compareGradeSnapshots(
  previous: GradeSnapshotData,
  current: GradeSnapshotData,
): {
  versionFrom: number;
  versionTo: number;
  summaryChanges: GradeVersionDiff[];
  entryCountDelta: number;
} {
  const summaryChanges: GradeVersionDiff[] = [];
  const keys: Array<keyof SnapshotGradeSummary> = [
    'percentage',
    'letterGrade',
    'gradePoints',
    'result',
    'finalMarks',
    'totalMarksEarned',
    'totalMarksPossible',
  ];

  for (const key of keys) {
    const before = previous.summary[key];
    const after = current.summary[key];
    if (before !== after) {
      summaryChanges.push({ field: key, before, after });
    }
  }

  return {
    versionFrom: previous.version,
    versionTo: current.version,
    summaryChanges,
    entryCountDelta: current.entries.length - previous.entries.length,
  };
}
