import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const courseLessonVersionSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseLesson',
      required: true,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    version: { type: Number, required: true, min: 1 },
    snapshot: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'course_lesson_versions' },
);

courseLessonVersionSchema.index({ lessonId: 1, version: -1 }, { unique: true });

export type CourseLessonVersionDocument = InferSchemaType<
  typeof courseLessonVersionSchema
> & {
  _id: Types.ObjectId;
};

export const CourseLessonVersionModel = model<CourseLessonVersionDocument>(
  'CourseLessonVersion',
  courseLessonVersionSchema,
);
