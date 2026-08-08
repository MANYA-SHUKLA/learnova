import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const bookmarkTargetTypes = ['module', 'lesson', 'resource'] as const;

const learningBookmarkSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseModule',
      default: null,
      index: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseLesson',
      default: null,
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseResource',
      default: null,
      index: true,
    },
    targetType: {
      type: String,
      enum: bookmarkTargetTypes,
      required: true,
      index: true,
    },
    note: { type: String, default: null, trim: true, maxlength: 2000 },
  },
  { timestamps: true, collection: 'learning_bookmarks' },
);

learningBookmarkSchema.index({ institutionId: 1, studentId: 1, courseId: 1 });
learningBookmarkSchema.index({ institutionId: 1, studentId: 1, createdAt: -1 });

export type LearningBookmarkDocument = InferSchemaType<typeof learningBookmarkSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const LearningBookmarkModel = model<LearningBookmarkDocument>(
  'LearningBookmark',
  learningBookmarkSchema,
);
