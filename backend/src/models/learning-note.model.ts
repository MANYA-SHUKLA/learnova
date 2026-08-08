import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const learningNoteSchema = new Schema(
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
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseLesson',
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true, maxlength: 20_000 },
  },
  { timestamps: true, collection: 'learning_notes' },
);

learningNoteSchema.index({ institutionId: 1, studentId: 1, courseId: 1 });
learningNoteSchema.index({ institutionId: 1, studentId: 1, lessonId: 1 });
learningNoteSchema.index({ institutionId: 1, studentId: 1, createdAt: -1 });

export type LearningNoteDocument = InferSchemaType<typeof learningNoteSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const LearningNoteModel = model<LearningNoteDocument>('LearningNote', learningNoteSchema);
