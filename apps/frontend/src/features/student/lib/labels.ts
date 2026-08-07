import type { StudentStatus, StudentGender } from '@learnova/types';

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
  graduated: 'Graduated',
  dropped: 'Dropped',
  transferred: 'Transferred',
  archived: 'Archived',
};

export const STUDENT_GENDER_LABELS: Record<StudentGender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

export function formatStudentStatus(status: StudentStatus) {
  return STUDENT_STATUS_LABELS[status] ?? status;
}

export function formatStudentGender(gender: StudentGender) {
  return STUDENT_GENDER_LABELS[gender] ?? gender;
}
