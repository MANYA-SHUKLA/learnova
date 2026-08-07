import type {
  EnrollmentStatus,
  EnrollmentMethod,
  EnrollmentCompletionStatus,
  EnrollmentApprovalStatus,
} from '@learnova/types';

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  active: 'Active',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
  dropped: 'Dropped',
  expired: 'Expired',
};

export const ENROLLMENT_METHOD_LABELS: Record<EnrollmentMethod, string> = {
  manual: 'Manual',
  bulk_import: 'Bulk Import',
  self_enrollment: 'Self Enrollment',
  invite: 'Invite',
  api: 'API',
};

export const ENROLLMENT_COMPLETION_STATUS_LABELS: Record<
  EnrollmentCompletionStatus,
  string
> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const ENROLLMENT_APPROVAL_STATUS_LABELS: Record<EnrollmentApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  not_required: 'Not Required',
};

export function formatEnrollmentStatus(status: EnrollmentStatus) {
  return ENROLLMENT_STATUS_LABELS[status] ?? status;
}

export function formatEnrollmentMethod(method: EnrollmentMethod) {
  return ENROLLMENT_METHOD_LABELS[method] ?? method;
}

export function formatEnrollmentCompletionStatus(status: EnrollmentCompletionStatus) {
  return ENROLLMENT_COMPLETION_STATUS_LABELS[status] ?? status;
}

export function formatEnrollmentApprovalStatus(status: EnrollmentApprovalStatus) {
  return ENROLLMENT_APPROVAL_STATUS_LABELS[status] ?? status;
}
