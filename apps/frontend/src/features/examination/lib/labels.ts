import type { ExamAttemptStatus, ExamStatus, ExamType, ProctoringMode } from '@learnova/types';

const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  in_progress: 'In progress',
  completed: 'Completed',
  archived: 'Archived',
  cancelled: 'Cancelled',
};

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  midterm: 'Midterm',
  final: 'Final',
  internal: 'Internal',
  external: 'External',
  practical: 'Practical',
  viva: 'Viva',
};

const PROCTORING_LABELS: Record<ProctoringMode, string> = {
  none: 'None',
  live: 'Live proctoring',
  record_review: 'Record & review',
  ai_assisted: 'AI assisted',
};

export function formatExamStatus(status: ExamStatus): string {
  return EXAM_STATUS_LABELS[status] ?? status;
}

const EXAM_ATTEMPT_STATUS_LABELS: Record<ExamAttemptStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
  graded: 'Graded',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export function formatExamAttemptStatus(status: ExamAttemptStatus): string {
  return EXAM_ATTEMPT_STATUS_LABELS[status] ?? status;
}

export function formatExamType(type: ExamType): string {
  return EXAM_TYPE_LABELS[type] ?? type;
}

export function formatProctoringMode(mode: ProctoringMode): string {
  return PROCTORING_LABELS[mode] ?? mode;
}

export function formatExamWindow(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return `${start.toLocaleString()} – ${end.toLocaleTimeString()}`;
}
