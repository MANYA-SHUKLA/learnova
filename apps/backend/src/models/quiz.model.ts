import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import {
  QUIZ_DIFFICULTIES,
  QUIZ_STATUSES,
  QUIZ_TYPES,
  QUIZ_VISIBILITIES,
} from '@learnova/constants';

export { QUIZ_TYPES, QUIZ_STATUSES, QUIZ_VISIBILITIES, QUIZ_DIFFICULTIES };

const quizSchema = new Schema(
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
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    description: { type: String, default: null },
    instructions: { type: String, default: null },
    visibility: {
      type: String,
      enum: QUIZ_VISIBILITIES,
      default: 'enrolled',
      index: true,
    },
    status: {
      type: String,
      enum: QUIZ_STATUSES,
      default: 'draft',
      index: true,
    },
    quizType: {
      type: String,
      enum: QUIZ_TYPES,
      default: 'practice',
      index: true,
    },
    difficulty: {
      type: String,
      enum: QUIZ_DIFFICULTIES,
      default: 'medium',
      index: true,
    },
    passingMarks: { type: Number, default: 40, min: 0 },
    totalMarks: { type: Number, default: 100, min: 0 },
    durationMinutes: { type: Number, default: null, min: 1 },
    attemptLimit: { type: Number, default: 3, min: 1, max: 20 },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    showResultsImmediately: { type: Boolean, default: true },
    showCorrectAnswers: { type: Boolean, default: false },
    allowReview: { type: Boolean, default: true },
    negativeMarking: { type: Boolean, default: false },
    negativeMarkValue: { type: Number, default: 0.25, min: 0 },
    publishDate: { type: Date, default: null, index: true },
    closeDate: { type: Date, default: null, index: true },
    sectionIds: [{ type: Schema.Types.ObjectId, ref: 'QuizSection' }],
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'quizzes' },
);

quizSchema.index({ institutionId: 1, courseId: 1, status: 1, deletedAt: 1 });
quizSchema.index({ institutionId: 1, slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
quizSchema.index({ institutionId: 1, title: 'text', description: 'text' });

export type QuizDocument = InferSchemaType<typeof quizSchema> & { _id: Types.ObjectId };

export const QuizModel = model('Quiz', quizSchema);
