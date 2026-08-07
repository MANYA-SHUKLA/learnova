import { Schema, model, type InferSchemaType } from 'mongoose';

const courseModuleSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    order: { type: Number, default: 0, min: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'course_modules' },
);

courseModuleSchema.index({ courseId: 1, order: 1 });
courseModuleSchema.index({ courseId: 1, isActive: 1 });

export type CourseModuleDocument = InferSchemaType<typeof courseModuleSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CourseModuleModel = model<CourseModuleDocument>('CourseModule', courseModuleSchema);
