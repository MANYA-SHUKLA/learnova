import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const institutionAuditLogSchema = new Schema(
  {
    event: {
      type: String,
      required: true,
      index: true,
      enum: [
        'institution.created',
        'institution.updated',
        'campus.created',
        'campus.updated',
        'campus.deleted',
        'school.created',
        'school.updated',
        'department.created',
        'department.updated',
        'program.created',
        'program.updated',
        'academic_year.created',
        'semester.created',
        'calendar.updated',
        'settings.updated',
        'entity.archived',
        'entity.restored',
      ],
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'institution_audit_logs' },
);

export type InstitutionAuditLogDocument = InferSchemaType<typeof institutionAuditLogSchema> & {
  _id: Types.ObjectId;
};

export const InstitutionAuditLogModel = model('InstitutionAuditLog', institutionAuditLogSchema);
