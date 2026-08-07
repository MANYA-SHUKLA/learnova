export const EXAM_TYPES = [
  'midterm',
  'final',
  'internal',
  'external',
  'practical',
  'viva',
] as const;

export const EXAM_STATUSES = [
  'draft',
  'scheduled',
  'published',
  'in_progress',
  'completed',
  'archived',
  'cancelled',
] as const;

export const EXAM_VISIBILITIES = ['institution', 'enrolled', 'faculty'] as const;

export const PROCTORING_MODES = ['none', 'live', 'record_review', 'ai_assisted'] as const;

export const SECURE_BROWSER_POLICIES = ['off', 'recommended', 'required'] as const;

export const EXAM_ATTEMPT_STATUSES = [
  'scheduled',
  'checked_in',
  'started',
  'submitted',
  'completed',
  'expired',
  'terminated',
  'absent',
] as const;

export const PROCTOR_EVENT_TYPES = [
  'session_started',
  'session_ended',
  'tab_switch',
  'fullscreen_exit',
  'camera_off',
  'microphone_off',
  'suspicious_activity',
  'manual_flag',
  'manual_clear',
  'attempt_terminated',
] as const;

export const EXAM_AUDIT_EVENTS = [
  'exam.created',
  'exam.updated',
  'exam.deleted',
  'exam.scheduled',
  'exam.published',
  'exam.started',
  'exam.completed',
  'exam.cancelled',
  'attempt.checked_in',
  'attempt.started',
  'attempt.submitted',
  'proctor.flagged',
  'proctor.cleared',
] as const;

export const EXAM_BULK_ACTIONS = [
  'publish',
  'schedule',
  'archive',
  'cancel',
  'duplicate',
  'delete',
] as const;

export const EXAM_DEFAULTS = {
  PASSING_MARKS: 40,
  TOTAL_MARKS: 100,
  DURATION_MINUTES: 120,
  ATTEMPT_LIMIT: 1,
  LATE_ENTRY_MINUTES: 15,
  GRACE_PERIOD_MINUTES: 5,
  MAX_TAB_SWITCHES: 3,
} as const;
