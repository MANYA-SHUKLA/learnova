import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const examRoomSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    roomCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    invigilatorIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    capacity: { type: Number, default: 50, min: 1 },
    studentCount: { type: Number, default: 0, min: 0 },
    isVirtual: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'exam_rooms' },
);

examRoomSchema.index({ institutionId: 1, examId: 1, roomCode: 1 }, { unique: true });

export type ExamRoomDocument = InferSchemaType<typeof examRoomSchema> & { _id: Types.ObjectId };

export const ExamRoomModel = model('ExamRoom', examRoomSchema);
