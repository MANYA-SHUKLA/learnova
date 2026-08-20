export const NOTIFICATION_TYPES = [
  'assignment_due',
  'exam_scheduled',
  'project_deadline',
  'grade_published',
  'certificate_issued',
  'course_announcement',
  'class_reminder',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ['in_app', 'email'] as const;
