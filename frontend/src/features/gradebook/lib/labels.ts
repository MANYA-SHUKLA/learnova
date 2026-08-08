import type { GradebookEntry } from '@learnova/types';

export function formatActivityKind(kind: GradebookEntry['activityKind']): string {
  switch (kind) {
    case 'assignment':
      return 'Assignment';
    case 'lab':
      return 'Practice Lab';
    case 'quiz':
      return 'Quiz';
    case 'exam':
      return 'Exam';
    case 'project':
      return 'Project';
    default:
      return kind;
  }
}

export function formatPercentage(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}%`;
}

export function formatMarks(
  obtained: number | null | undefined,
  total: number | null | undefined,
): string {
  if (obtained == null && total == null) return '—';
  return `${obtained ?? '—'} / ${total ?? '—'}`;
}
