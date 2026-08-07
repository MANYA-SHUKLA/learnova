export const GRADEBOOK_ENTRY_STATUSES = ['pending', 'final', 'exported', 'superseded'] as const;

/** Course grade / gradebook record lifecycle */
export const COURSE_GRADE_STATUSES = [
  'draft',
  'faculty_review',
  'published',
  'revision',
  'archived',
  'finalized', // legacy alias — treated as published+locked
] as const;

export const GRADE_RESULTS = ['pass', 'fail', 'incomplete'] as const;

export const GRADEBOOK_ATTEMPT_POLICIES = ['best', 'latest', 'average'] as const;

export const GRADEBOOK_SOURCE_COLLECTIONS = [
  'assignment_grades',
  'quiz_results',
  'exam_results',
  'lab_progress',
  'project_grades',
] as const;

/** Enterprise letter grade scale with grade points (4.0 scale) */
export const GRADE_SCALE_BANDS = [
  { min: 97, letter: 'A+', points: 4.0, result: 'pass' as const },
  { min: 93, letter: 'A', points: 4.0, result: 'pass' as const },
  { min: 90, letter: 'A-', points: 3.7, result: 'pass' as const },
  { min: 87, letter: 'B+', points: 3.3, result: 'pass' as const },
  { min: 83, letter: 'B', points: 3.0, result: 'pass' as const },
  { min: 80, letter: 'B-', points: 2.7, result: 'pass' as const },
  { min: 77, letter: 'C+', points: 2.3, result: 'pass' as const },
  { min: 73, letter: 'C', points: 2.0, result: 'pass' as const },
  { min: 70, letter: 'C-', points: 1.7, result: 'pass' as const },
  { min: 67, letter: 'D+', points: 1.3, result: 'pass' as const },
  { min: 63, letter: 'D', points: 1.0, result: 'pass' as const },
  { min: 60, letter: 'D-', points: 0.7, result: 'pass' as const },
  { min: 0, letter: 'F', points: 0.0, result: 'fail' as const },
] as const;

/** Legacy simple bands — kept for backward compatibility */
export const GRADEBOOK_LETTER_BANDS = [
  { min: 90, letter: 'A' },
  { min: 80, letter: 'B' },
  { min: 70, letter: 'C' },
  { min: 60, letter: 'D' },
  { min: 0, letter: 'F' },
] as const;

export const GRADEBOOK_DEFAULTS = {
  ASSIGNMENT_WEIGHT: 20,
  LAB_WEIGHT: 10,
  QUIZ_WEIGHT: 10,
  MIDTERM_WEIGHT: 20,
  FINAL_EXAM_WEIGHT: 30,
  PROJECT_WEIGHT: 10,
  ATTENDANCE_WEIGHT: 0,
  EXTRA_CREDIT_WEIGHT: 0,
  ATTEMPT_POLICY: 'best' as const,
  PASSING_PERCENTAGE: 60,
} as const;

export const GRADE_APPEAL_STATUSES = [
  'pending',
  'under_review',
  'accepted',
  'rejected',
] as const;

export const GRADE_COMMENT_VISIBILITIES = ['internal', 'faculty', 'student'] as const;

export const GRADEBOOK_AUDIT_EVENTS = [
  'entry.ingested',
  'entry.updated',
  'entry.superseded',
  'summary.computed',
  'summary.finalized',
  'grade.calculated',
  'grade.published',
  'grade.locked',
  'grade.unlocked',
  'appeal.created',
  'appeal.resolved',
  'project.graded',
  'course.synced',
] as const;

export const GRADEBOOK_BULK_ACTIONS = [
  'publish',
  'lock',
  'unlock',
  'recalculate',
  'export',
] as const;

export const GRADEBOOK_REPORT_TYPES = [
  'student',
  'course',
  'department',
  'semester',
  'program',
  'institution',
] as const;
