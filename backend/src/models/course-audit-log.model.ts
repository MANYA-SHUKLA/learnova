import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const courseAuditEvents = [
  'course.created',
  'course.updated',
  'course.deleted',
  'course.restored',
  'course.published',
  'course.unpublished',
  'course.archived',
  'course.duplicated',
  'course.assigned.faculty',
  'course.imported',
  'course.import.started',
  'course.import.completed',
  'course.exported',
  'course.export',
] as const;

const courseAuditLogSchema = new Schema(
  {
    event: {
      type: String,
      required: true,
      index: true,
      enum: courseAuditEvents,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'course_audit_logs' },
);

export type CourseAuditEvent = (typeof courseAuditEvents)[number];

export type CourseAuditLogDocument = InferSchemaType<typeof courseAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const CourseAuditLogModel = model('CourseAuditLog', courseAuditLogSchema);
