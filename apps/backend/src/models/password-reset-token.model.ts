import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const passwordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'password_reset_tokens' },
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetTokenDocument = InferSchemaType<
  typeof passwordResetTokenSchema
> & { _id: Types.ObjectId };

export const PasswordResetTokenModel = model(
  'PasswordResetToken',
  passwordResetTokenSchema,
);
