import { Types } from 'mongoose';
import { ASSESSMENT_ENROLLMENT_STATUSES } from '@learnova/constants';
import type { GradebookAttemptPolicy } from '@learnova/types';

export const ACTIVE_ENROLLMENT_STATUSES = ASSESSMENT_ENROLLMENT_STATUSES;

export function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

export function pageMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function toDto(doc: {
  _id: Types.ObjectId;
  toObject?: () => Record<string, unknown>;
}): Record<string, unknown> {
  const raw =
    typeof doc.toObject === 'function'
      ? doc.toObject()
      : (doc as unknown as Record<string, unknown>);
  const { _id, __v, ...rest } = raw as Record<string, unknown> & {
    _id: Types.ObjectId;
    __v?: number;
  };

  const normalize = (value: unknown): unknown => {
    if (value instanceof Types.ObjectId) return String(value);
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k] = normalize(v);
      }
      return out;
    }
    return value;
  };

  return {
    id: String(_id),
    ...(normalize(rest) as Record<string, unknown>),
  };
}

export interface ScoredAttemptRow {
  sourceRefId: Types.ObjectId;
  percentage: number;
  score: number;
  createdAt: Date;
}

export function pickAttemptByPolicy(
  rows: ScoredAttemptRow[],
  policy: GradebookAttemptPolicy,
): ScoredAttemptRow | null {
  if (rows.length === 0) return null;
  if (policy === 'latest') {
    return [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
  }
  if (policy === 'average') {
    const avgPct =
      rows.reduce((sum, row) => sum + row.percentage, 0) / Math.max(rows.length, 1);
    const avgScore = rows.reduce((sum, row) => sum + row.score, 0) / Math.max(rows.length, 1);
    const latest = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    return {
      sourceRefId: latest.sourceRefId,
      percentage: Math.round(avgPct * 100) / 100,
      score: Math.round(avgScore * 100) / 100,
      createdAt: latest.createdAt,
    };
  }
  return [...rows].sort((a, b) => b.percentage - a.percentage || b.score - a.score)[0] ?? null;
}

export function kindWeightKey(
  kind: string,
): 'assignmentWeight' | 'labWeight' | 'quizWeight' | 'examWeight' | 'projectWeight' {
  switch (kind) {
    case 'assignment':
      return 'assignmentWeight';
    case 'lab':
      return 'labWeight';
    case 'quiz':
      return 'quizWeight';
    case 'exam':
      return 'examWeight';
    case 'project':
      return 'projectWeight';
    default:
      return 'assignmentWeight';
  }
}
