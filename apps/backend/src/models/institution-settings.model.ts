import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const institutionSettingsSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      unique: true,
    },
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'system' },
    attendance: { type: Schema.Types.Mixed, default: {} },
    gradingScale: { type: Schema.Types.Mixed, default: {} },
    examRules: { type: Schema.Types.Mixed, default: {} },
    certificateSettings: { type: Schema.Types.Mixed, default: {} },
    storageSettings: { type: Schema.Types.Mixed, default: {} },
    aiSettings: { type: Schema.Types.Mixed, default: {} },
    notificationSettings: { type: Schema.Types.Mixed, default: {} },
    securitySettings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'institution_settings' },
);

export type InstitutionSettingsDocument = InferSchemaType<typeof institutionSettingsSchema> & {
  _id: Types.ObjectId;
};

export const InstitutionSettingsModel = model('InstitutionSettings', institutionSettingsSchema);
