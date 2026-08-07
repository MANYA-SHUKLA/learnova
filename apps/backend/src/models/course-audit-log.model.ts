import { Schema, model, type InferSchemaType } from 'mongoose';

const courseAuditLogSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    action: { type: String, required: true, trim: true, index: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'course_audit_logs' },
);

courseAuditLogSchema.index({ courseId: 1, createdAt: -1 });
courseAuditLogSchema.index({ performedBy: 1, createdAt: -1 });
courseAuditLogSchema.index({ action: 1, createdAt: -1 });

export type CourseAuditLogDocument = InferSchemaType<typeof courseAuditLogSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
};

export const CourseAuditLogModel = model<CourseAuditLogDocument>(
  'CourseAuditLog',
  courseAuditLogSchema,
);
