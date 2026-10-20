import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const demoRequestSchema = new Schema(
  {
    institutionName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    message: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined', 'provisioned'],
      default: 'pending',
      index: true,
    },
    confirmedAt: { type: Date, default: null },
    meetingAt: { type: Date, default: null },
    meetingNotes: { type: String, default: null },
    declinedAt: { type: Date, default: null },
    declineReason: { type: String, default: null },
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', default: null },
  },
  { timestamps: true, collection: 'demo_requests' },
);

demoRequestSchema.index({ createdAt: -1 });

export type DemoRequestDocument = InferSchemaType<typeof demoRequestSchema> & {
  _id: Types.ObjectId;
};

export const DemoRequestModel = model('DemoRequest', demoRequestSchema);
