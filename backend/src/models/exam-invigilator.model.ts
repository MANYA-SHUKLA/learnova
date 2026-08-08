import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { INVIGILATOR_ROLES } from '@learnova/constants';

export { INVIGILATOR_ROLES };

const examInvigilatorSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: INVIGILATOR_ROLES, required: true, default: 'monitor' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'exam_invigilators' },
);

examInvigilatorSchema.index({ institutionId: 1, examId: 1, userId: 1 }, { unique: true });

export type ExamInvigilatorDocument = InferSchemaType<typeof examInvigilatorSchema> & {
  _id: Types.ObjectId;
};

export const ExamInvigilatorModel = model('ExamInvigilator', examInvigilatorSchema);
