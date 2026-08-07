export const QUIZ_TYPES = [
  'practice',
  'lesson',
  'module',
  'course',
  'revision',
] as const;

export const QUIZ_STATUSES = ['draft', 'published', 'archived', 'closed'] as const;

export const QUIZ_VISIBILITIES = ['institution', 'enrolled', 'faculty'] as const;

export const QUIZ_DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'] as const;

export const QUESTION_TYPES = [
  'single_choice',
  'multiple_choice',
  'true_false',
  'assertion_reason',
  'match_following',
  'fill_blank',
] as const;

export const QUESTION_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const QUIZ_ATTEMPT_STATUSES = [
  'started',
  'submitted',
  'completed',
  'expired',
  'abandoned',
] as const;

export const QUESTION_BANK_STATUSES = ['active', 'archived'] as const;

export const QUIZ_AUDIT_EVENTS = [
  'quiz.created',
  'quiz.updated',
  'quiz.deleted',
  'quiz.published',
  'quiz.archived',
  'quiz.closed',
  'question.created',
  'question.updated',
  'question.deleted',
  'attempt.started',
  'attempt.submitted',
  'attempt.completed',
] as const;

export const QUIZ_BULK_ACTIONS = [
  'publish',
  'archive',
  'duplicate',
  'delete',
  'assign_faculty',
] as const;

export const QUIZ_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'title',
  'difficulty',
  'durationMinutes',
  'publishDate',
] as const;

export const QUIZ_DEFAULTS = {
  PASSING_MARKS: 40,
  TOTAL_MARKS: 100,
  ATTEMPT_LIMIT: 3,
  DURATION_MINUTES: 30,
  NEGATIVE_MARK_VALUE: 0.25,
} as const;
