import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export type ProgressAuditEvent =
  | 'progress_updated'
  | 'lesson_opened'
  | 'lesson_completed'
  | 'module_completed'
  | 'course_completed'
  | 'resource_progress_updated'
  | 'session_started'
  | 'session_ended'
  | 'bookmark_created'
  | 'bookmark_deleted'
  | 'note_created'
  | 'note_updated'
  | 'note_deleted'
  | 'notes_exported';

export const PROGRESS_AUDIT_EVENTS: ProgressAuditEvent[] = [
  'progress_updated',
  'lesson_opened',
  'lesson_completed',
  'module_completed',
  'course_completed',
  'resource_progress_updated',
  'session_started',
  'session_ended',
  'bookmark_created',
  'bookmark_deleted',
  'note_created',
  'note_updated',
  'note_deleted',
  'notes_exported',
];

const progressAuditLogSchema = new Schema(
  {
    event: {
      type: String,
      enum: PROGRESS_AUDIT_EVENTS,
      required: true,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', default: null },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', default: null },
    resourceId: { type: Schema.Types.ObjectId, ref: 'CourseResource', default: null },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'progress_audit_logs' },
);

progressAuditLogSchema.index({ institutionId: 1, createdAt: -1 });
progressAuditLogSchema.index({ institutionId: 1, studentId: 1, createdAt: -1 });
progressAuditLogSchema.index({ institutionId: 1, courseId: 1, createdAt: -1 });

export type ProgressAuditLogDocument = InferSchemaType<typeof progressAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const ProgressAuditLogModel = model('ProgressAuditLog', progressAuditLogSchema);
