import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const courseResourceSchema = new Schema(
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
    type: {
      type: String,
      enum: [
        'pdf',
        'video',
        'image',
        'audio',
        'zip',
        'markdown',
        'html',
        'external_link',
        'presentation',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: null, trim: true },
    url: { type: String, default: null },
    storageKey: { type: String, default: null },
    fileName: { type: String, default: null },
    mimeType: { type: String, default: null },
    size: { type: Number, default: null, min: 0 },
    orderIndex: { type: Number, default: 0, min: 0, index: true },
    visibility: {
      type: String,
      enum: ['private', 'enrolled', 'public'],
      default: 'enrolled',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'course_resources' },
);

courseResourceSchema.index({ lessonId: 1, orderIndex: 1 });
courseResourceSchema.index({ courseId: 1, type: 1 });

export type CourseResourceDocument = InferSchemaType<typeof courseResourceSchema> & {
  _id: Types.ObjectId;
};

export const CourseResourceModel = model<CourseResourceDocument>(
  'CourseResource',
  courseResourceSchema,
);
