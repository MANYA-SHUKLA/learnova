import { Schema, model, Types, type InferSchemaType } from 'mongoose';

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
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    lessonNumber: { type: Number, default: 1, min: 1 },
    orderIndex: { type: Number, default: 0, min: 0, index: true },
    description: { type: String, default: null, trim: true },
    summary: { type: String, default: null, trim: true },
    content: { type: String, default: null },
    estimatedMinutes: { type: Number, default: null, min: 0 },
    visibility: {
      type: String,
      enum: ['private', 'enrolled', 'public', 'preview'],
      default: 'enrolled',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'hidden', 'archived'],
      default: 'draft',
      index: true,
    },
    lessonType: {
      type: String,
      enum: [
        'video',
        'pdf',
        'markdown',
        'rich_text',
        'html',
        'external_link',
        'code_snippet',
        'image',
        'audio',
        'presentation',
        'download',
      ],
      default: 'rich_text',
      index: true,
    },
    allowComments: { type: Boolean, default: true },
    allowDownloads: { type: Boolean, default: true },
    isPreview: { type: Boolean, default: false, index: true },
    isLocked: { type: Boolean, default: false, index: true },
    unlockAfterLessonId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseLesson',
      default: null,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'course_lessons' },
);

courseLessonSchema.index({ courseId: 1, moduleId: 1, orderIndex: 1 });
courseLessonSchema.index({ moduleId: 1, slug: 1 }, { unique: true });
courseLessonSchema.index({ courseId: 1, status: 1, lessonType: 1 });

export type CourseLessonDocument = InferSchemaType<typeof courseLessonSchema> & {
  _id: Types.ObjectId;
};

export const CourseLessonModel = model<CourseLessonDocument>('CourseLesson', courseLessonSchema);
