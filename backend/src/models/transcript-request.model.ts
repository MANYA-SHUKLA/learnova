import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { TRANSCRIPT_REQUEST_STATUSES, TRANSCRIPT_REQUEST_TYPES } from '@learnova/constants';

const transcriptRequestSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null, index: true },
    requestType: {
      type: String,
      enum: TRANSCRIPT_REQUEST_TYPES,
      default: 'official',
      index: true,
    },
    status: {
      type: String,
      enum: TRANSCRIPT_REQUEST_STATUSES,
      default: 'pending',
      index: true,
    },
    reason: { type: String, default: null, trim: true, maxlength: 2000 },
    requestedAt: { type: Date, default: () => new Date(), index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNotes: { type: String, default: null, trim: true, maxlength: 2000 },
    completedAt: { type: Date, default: null },
    transcriptId: { type: Schema.Types.ObjectId, ref: 'AcademicTranscript', default: null },
  },
  { timestamps: true, collection: 'transcript_requests' },
);

transcriptRequestSchema.index({ institutionId: 1, studentId: 1, requestedAt: -1 });

export type TranscriptRequestDocument = InferSchemaType<typeof transcriptRequestSchema> & {
  _id: Types.ObjectId;
};

export const TranscriptRequestModel = model('TranscriptRequest', transcriptRequestSchema);
