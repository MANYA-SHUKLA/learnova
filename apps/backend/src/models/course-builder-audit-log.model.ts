import { Schema, model, Types, type InferSchemaType } from 'mongoose';

export const COURSE_BUILDER_AUDIT_EVENTS = [
  'module.created',
  'module.updated',
  'module.deleted',
  'module.restored',
  'module.duplicated',
  'lesson.created',
  'lesson.updated',
  'lesson.deleted',
  'lesson.restored',
  'lesson.duplicated',
  'resource.uploaded',
  'resource.deleted',
  'builder.reordered',
  'builder.saved',
] as const;

export type CourseBuilderAuditEvent = (typeof COURSE_BUILDER_AUDIT_EVENTS)[number];

const courseBuilderAuditLogSchema = new Schema(
  {
    event: {
      type: String,
      enum: COURSE_BUILDER_AUDIT_EVENTS,
      required: true,
      index: true,
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
      required: true,
      index: true,
    },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', default: null },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', default: null },
    resourceId: { type: Schema.Types.ObjectId, ref: 'CourseResource', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'course_builder_audit_logs' },
);

courseBuilderAuditLogSchema.index({ courseId: 1, createdAt: -1 });

export type CourseBuilderAuditLogDocument = InferSchemaType<
  typeof courseBuilderAuditLogSchema
> & {
  _id: Types.ObjectId;
};

export const CourseBuilderAuditLogModel = model<CourseBuilderAuditLogDocument>(
  'CourseBuilderAuditLog',
  courseBuilderAuditLogSchema,
);
