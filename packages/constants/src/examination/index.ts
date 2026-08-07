export const EXAM_TYPES = [
  'midterm',
  'final',
  'internal',
  'external',
  'practical',
  'viva',
  'lab_exam',
  'online',
  'offline',
  'supplementary',
  'mock',
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
  'disconnected',
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
  'violation.recorded',
] as const;

export const EXAM_BULK_ACTIONS = [
  'publish',
  'schedule',
  'archive',
  'cancel',
  'duplicate',
  'delete',
  'export',
] as const;

export const EXAM_VIOLATION_TYPES = [
  'fullscreen_exit',
  'tab_switch',
  'multiple_faces',
  'face_missing',
  'camera_blocked',
  'microphone_blocked',
  'browser_resize',
  'shortcut_attempt',
  'clipboard_attempt',
] as const;

export const EXAM_AUTO_ACTIONS = [
  'warning',
  'record_event',
  'auto_submit',
  'lock_exam',
  'notify_faculty',
] as const;

export const EXAM_ATTENDANCE_STATUSES = ['present', 'absent', 'late'] as const;

export const INVIGILATOR_ROLES = ['view_only', 'monitor', 'intervene'] as const;

export const EXAM_INCIDENT_TYPES = [
  'exam.published',
  'exam.version_created',
  'attempt.checked_in',
  'attempt.started',
  'attempt.disconnected',
  'attempt.reconnected',
  'attempt.submitted',
  'attempt.terminated',
  'warning.issued',
  'violation.recorded',
  'proctor.flagged',
  'proctor.cleared',
  'accessibility.applied',
] as const;

export const ACCESSIBILITY_FONT_SIZES = ['default', 'large', 'xlarge'] as const;

export const EXAM_DEFAULTS = {
  PASSING_MARKS: 40,
  TOTAL_MARKS: 100,
  DURATION_MINUTES: 120,
  ATTEMPT_LIMIT: 1,
  LATE_ENTRY_MINUTES: 15,
  GRACE_PERIOD_MINUTES: 5,
  MAX_TAB_SWITCHES: 3,
  RECONNECTION_GRACE_MINUTES: 5,
  EXTENDED_TIME_PERCENT: 25,
} as const;
