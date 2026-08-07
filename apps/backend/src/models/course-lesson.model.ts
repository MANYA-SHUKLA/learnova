import { Schema, model, type InferSchemaType } from 'mongoose';

const courseLessonSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseModule',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    order: { type: Number, default: 0, min: 0, index: true },
    contentType: {
      type: String,
      enum: [
        'video',
        'pdf',
        'markdown',
        'html',
        'image',
        'audio',
        'link',
        'embed',
        'code',
        'download',
        'presentation',
      ],
      required: true,
    },
    contentUrl: { type: String, default: null },
    contentText: { type: String, default: null },
    contentMetadata: { type: Schema.Types.Mixed, default: {} },
    durationMinutes: { type: Number, default: null, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'course_lessons' },
);

courseLessonSchema.index({ courseId: 1, moduleId: 1, order: 1 });
courseLessonSchema.index({ moduleId: 1, isActive: 1 });

export type CourseLessonDocument = InferSchemaType<typeof courseLessonSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CourseLessonModel = model<CourseLessonDocument>('CourseLesson', courseLessonSchema);
