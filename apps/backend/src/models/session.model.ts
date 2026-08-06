import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    browser: { type: String, default: null },
    os: { type: String, default: null },
    country: { type: String, default: null },
    lastActivityAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    isCurrent: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'sessions' },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionDocument = InferSchemaType<typeof sessionSchema> & {
  _id: Types.ObjectId;
};

export const SessionModel = model('Session', sessionSchema);
