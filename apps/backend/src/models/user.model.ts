import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, required: true, index: true },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastPasswordChangedAt: { type: Date, default: null },
    /** When true, user must change password before accessing dashboards */
    mustChangePassword: { type: Boolean, default: false, index: true },
    passwordHistory: { type: [String], default: [] },
    tokenVersion: { type: Number, default: 0 },
    locale: { type: String, default: 'en' },
    avatarUrl: { type: String, default: null },
  },
  { timestamps: true, collection: 'users' },
);

userSchema.index({ email: 1 }, { unique: true });

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
};

export const UserModel = model('User', userSchema);
