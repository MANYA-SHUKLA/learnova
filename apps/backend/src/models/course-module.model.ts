import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const courseModuleSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    description: { type: String, default: null, trim: true },
    moduleNumber: { type: Number, default: 1, min: 1 },
    orderIndex: { type: Number, default: 0, min: 0, index: true },
    estimatedMinutes: { type: Number, default: null, min: 0 },
    visibility: {
      type: String,
      enum: ['private', 'enrolled', 'public'],
      default: 'enrolled',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'hidden', 'archived'],
      default: 'draft',
      index: true,
    },
    icon: { type: String, default: null },
    color: { type: String, default: null },
    isLocked: { type: Boolean, default: false },
    unlockAfterModuleId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseModule',
      default: null,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'course_modules' },
);

courseModuleSchema.index({ courseId: 1, orderIndex: 1 });
courseModuleSchema.index({ courseId: 1, slug: 1 }, { unique: true });
courseModuleSchema.index({ courseId: 1, status: 1 });

export type CourseModuleDocument = InferSchemaType<typeof courseModuleSchema> & {
  _id: Types.ObjectId;
};

export const CourseModuleModel = model<CourseModuleDocument>('CourseModule', courseModuleSchema);
