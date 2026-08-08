import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { GRADE_MODERATION_STAGES } from '@learnova/constants';

const gradeModerationRecordSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    courseGradeId: { type: Schema.Types.ObjectId, ref: 'CourseGradeSummary', default: null, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    stage: { type: String, enum: GRADE_MODERATION_STAGES, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: { type: String, default: null, trim: true },
    notes: { type: String, default: null, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'grade_moderation_records' },
);

gradeModerationRecordSchema.index({ institutionId: 1, courseId: 1, createdAt: -1 });
gradeModerationRecordSchema.index({ institutionId: 1, courseGradeId: 1, createdAt: -1 });

export type GradeModerationRecordDocument = InferSchemaType<typeof gradeModerationRecordSchema> & {
  _id: Types.ObjectId;
};

export const GradeModerationRecordModel = model(
  'GradeModerationRecord',
  gradeModerationRecordSchema,
);
