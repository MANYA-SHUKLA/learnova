import type { AssignmentStatus, AssignmentSubmissionStatus, AssignmentType } from '@learnova/types';

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
  closed: 'Closed',
};

const SUBMISSION_LABELS: Record<AssignmentSubmissionStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  late: 'Late',
  returned: 'Returned',
  graded: 'Graded',
  missing: 'Missing',
};

const TYPE_LABELS: Record<AssignmentType, string> = {
  homework: 'Homework',
  essay: 'Essay',
  research: 'Research',
  presentation: 'Presentation',
  case_study: 'Case Study',
  document_upload: 'Document Upload',
  pdf_upload: 'PDF Upload',
  image_upload: 'Image Upload',
  video_upload: 'Video Upload',
  mixed: 'Mixed',
};

export function formatAssignmentStatus(status: AssignmentStatus) {
  return STATUS_LABELS[status] ?? status;
}

export function formatSubmissionStatus(status: AssignmentSubmissionStatus) {
  return SUBMISSION_LABELS[status] ?? status;
}

export function formatAssignmentType(type: AssignmentType) {
  return TYPE_LABELS[type] ?? type;
}

export function formatDueDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
