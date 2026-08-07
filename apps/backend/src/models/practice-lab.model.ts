import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PRACTICE_DIFFICULTIES, PRACTICE_LANGUAGES, PRACTICE_LAB_STATUSES } from '@learnova/constants';

export const PRACTICE_LAB_VISIBILITIES = ['institution', 'enrolled', 'faculty'] as const;

const practiceLabSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', default: null, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200, index: true },
    description: { type: String, default: null },
    visibility: {
      type: String,
      enum: PRACTICE_LAB_VISIBILITIES,
      default: 'enrolled',
      index: true,
    },
    status: {
      type: String,
      enum: PRACTICE_LAB_STATUSES,
      default: 'draft',
      index: true,
    },
    difficulty: {
      type: String,
      enum: PRACTICE_DIFFICULTIES,
      default: 'medium',
      index: true,
    },
    estimatedMinutes: { type: Number, default: null },
    languages: {
      type: [{ type: String, enum: PRACTICE_LANGUAGES }],
      default: ['python', 'javascript'],
    },
    allowRun: { type: Boolean, default: true },
    allowSubmit: { type: Boolean, default: true },
    maxSubmissions: { type: Number, default: 50, min: 1, max: 500 },
    problemCount: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'practice_labs' },
);

practiceLabSchema.index({ institutionId: 1, courseId: 1, status: 1, deletedAt: 1 });
practiceLabSchema.index({ institutionId: 1, title: 'text', description: 'text' });

export type PracticeLabDocument = InferSchemaType<typeof practiceLabSchema> & {
  _id: Types.ObjectId;
};

export const PracticeLabModel = model('PracticeLab', practiceLabSchema);
