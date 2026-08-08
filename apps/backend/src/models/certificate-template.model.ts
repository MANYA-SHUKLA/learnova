import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { CERTIFICATE_DOCUMENT_TYPES, CERTIFICATE_STATUSES } from '@learnova/constants';

const templateSignatureSchema = new Schema(
  {
    role: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
  },
  { _id: false },
);

const templateDesignSchema = new Schema(
  {
    headerHtml: { type: String, default: null },
    footerHtml: { type: String, default: null },
    logoUrl: { type: String, default: null },
    sealUrl: { type: String, default: null },
    watermarkText: { type: String, default: null },
    backgroundColor: { type: String, default: '#ffffff' },
    primaryColor: { type: String, default: '#b8860b' },
    fontFamily: { type: String, default: 'Georgia, serif' },
  },
  { _id: false },
);

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
    design: { type: templateDesignSchema, default: () => ({}) },
    signatures: { type: [templateSignatureSchema], default: [] },
    numberPrefix: { type: String, default: null, trim: true },
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
