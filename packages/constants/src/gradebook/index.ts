export const GRADEBOOK_ENTRY_STATUSES = ['pending', 'final', 'exported', 'superseded'] as const;

export const COURSE_GRADE_STATUSES = ['draft', 'finalized'] as const;

export const GRADEBOOK_ATTEMPT_POLICIES = ['best', 'latest', 'average'] as const;

export const GRADEBOOK_SOURCE_COLLECTIONS = [
  'assignment_grades',
  'quiz_results',
  'exam_results',
  'lab_progress',
  'project_grades',
] as const;

export const GRADEBOOK_LETTER_BANDS = [
  { min: 90, letter: 'A' },
  { min: 80, letter: 'B' },
  { min: 70, letter: 'C' },
  { min: 60, letter: 'D' },
  { min: 0, letter: 'F' },
] as const;

export const GRADEBOOK_DEFAULTS = {
  ASSIGNMENT_WEIGHT: 25,
  LAB_WEIGHT: 10,
  QUIZ_WEIGHT: 15,
  EXAM_WEIGHT: 30,
  PROJECT_WEIGHT: 20,
  ATTEMPT_POLICY: 'best' as const,
} as const;

export const GRADEBOOK_AUDIT_EVENTS = [
  'entry.ingested',
  'entry.updated',
  'entry.superseded',
  'summary.computed',
  'summary.finalized',
  'project.graded',
  'course.synced',
] as const;
