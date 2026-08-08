import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const loginAttemptSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    ipAddress: { type: String, default: null, index: true },
    userAgent: { type: String, default: null },
    success: { type: Boolean, required: true },
    reason: { type: String, default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'login_attempts' },
);

loginAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export type LoginAttemptDocument = InferSchemaType<typeof loginAttemptSchema> & {
  _id: Types.ObjectId;
};

export const LoginAttemptModel = model('LoginAttempt', loginAttemptSchema);
