import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const auditAuthLogSchema = new Schema(
  {
    event: {
      type: String,
      required: true,
      index: true,
      enum: [
        'user.login',
        'user.login_failed',
        'user.logout',
        'user.logout_all',
        'user.registered',
        'password.changed',
        'password.reset_requested',
        'password.reset_completed',
        'email.verification_sent',
        'email.verified',
        'session.created',
        'session.revoked',
        'access.denied',
      ],
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    correlationId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'audit_auth_logs' },
);

export type AuditAuthLogDocument = InferSchemaType<typeof auditAuthLogSchema> & {
  _id: Types.ObjectId;
};

export const AuditAuthLogModel = model('AuditAuthLog', auditAuthLogSchema);
