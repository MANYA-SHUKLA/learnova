import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    version: { type: Number, required: true, default: 0 },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenId: { type: Schema.Types.ObjectId, ref: 'RefreshToken', default: null },
    userAgent: { type: String, default: null },
    ipAddress: { type: String, default: null },
  },
  { timestamps: true, collection: 'refresh_tokens' },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenDocument = InferSchemaType<typeof refreshTokenSchema> & {
  _id: Types.ObjectId;
};

export const RefreshTokenModel = model('RefreshToken', refreshTokenSchema);
