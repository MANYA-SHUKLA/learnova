import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const examDeviceSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    attemptId: { type: Schema.Types.ObjectId, ref: 'ExamAttempt', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    browser: { type: String, default: null },
    os: { type: String, default: null },
    screenWidth: { type: Number, default: null },
    screenHeight: { type: Number, default: null },
  },
  { timestamps: true, collection: 'exam_devices' },
);

examDeviceSchema.index({ institutionId: 1, attemptId: 1 }, { unique: true });

export type ExamDeviceDocument = InferSchemaType<typeof examDeviceSchema> & { _id: Types.ObjectId };

export const ExamDeviceModel = model('ExamDevice', examDeviceSchema);
