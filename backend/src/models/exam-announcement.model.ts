import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { EXAM_ANNOUNCEMENT_TYPES } from '@learnova/constants';

const examAnnouncementSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'ExamRoom', default: null },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    announcementType: {
      type: String,
      enum: EXAM_ANNOUNCEMENT_TYPES,
      default: 'general',
      index: true,
    },
    isEmergency: { type: Boolean, default: false },
    broadcastAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'exam_announcements' },
);

examAnnouncementSchema.index({ institutionId: 1, examId: 1, broadcastAt: -1 });

export type ExamAnnouncementDocument = InferSchemaType<typeof examAnnouncementSchema> & {
  _id: Types.ObjectId;
};

export const ExamAnnouncementModel = model('ExamAnnouncement', examAnnouncementSchema);
