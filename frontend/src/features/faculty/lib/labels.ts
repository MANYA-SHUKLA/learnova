import type { FacultyDesignation, FacultyEmploymentType, FacultyStatus } from '@learnova/types';

export const FACULTY_STATUS_LABELS: Record<FacultyStatus, string> = {
  active: 'Active',
  on_leave: 'On Leave',
  suspended: 'Suspended',
  retired: 'Retired',
  archived: 'Archived',
};

export const EMPLOYMENT_TYPE_LABELS: Record<FacultyEmploymentType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  adjunct: 'Adjunct',
  guest_faculty: 'Guest Faculty',
  visiting_professor: 'Visiting Professor',
  research_fellow: 'Research Fellow',
  teaching_assistant: 'Teaching Assistant',
};

export const DESIGNATION_LABELS: Record<FacultyDesignation, string> = {
  assistant_professor: 'Assistant Professor',
  associate_professor: 'Associate Professor',
  professor: 'Professor',
  head_of_department: 'Head of Department',
  dean: 'Dean',
  lecturer: 'Lecturer',
  research_scientist: 'Research Scientist',
  custom: 'Custom Designation',
};

export function formatFacultyStatus(status: FacultyStatus) {
  return FACULTY_STATUS_LABELS[status] ?? status;
}

export function formatEmploymentType(type: FacultyEmploymentType) {
  return EMPLOYMENT_TYPE_LABELS[type] ?? type;
}

export function formatDesignation(
  designation: FacultyDesignation,
  customDesignation?: string | null,
) {
  if (designation === 'custom' && customDesignation) return customDesignation;
  return DESIGNATION_LABELS[designation] ?? designation;
}
