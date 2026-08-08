import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { CERTIFICATE_DOCUMENT_TYPES } from '@learnova/constants';

const certificateTemplateSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    documentType: { type: String, enum: CERTIFICATE_DOCUMENT_TYPES, required: true, index: true },
    titleTemplate: { type: String, required: true, trim: true },
    bodyTemplate: { type: String, required: true, trim: true },
    footerTemplate: { type: String, default: null, trim: true },
    signatoryName: { type: String, default: null, trim: true },
    signatoryTitle: { type: String, default: null, trim: true },
    logoUrl: { type: String, default: null },
    active: { type: Boolean, default: true, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'certificate_templates' },
);

certificateTemplateSchema.index({ institutionId: 1, documentType: 1, active: 1 });

export type CertificateTemplateDocument = InferSchemaType<typeof certificateTemplateSchema> & {
  _id: Types.ObjectId;
};

export const CertificateTemplateModel = model('CertificateTemplate', certificateTemplateSchema);
