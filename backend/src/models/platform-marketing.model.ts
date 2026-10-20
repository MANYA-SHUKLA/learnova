import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const sectionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const platformMarketingSchema = new Schema(
  {
    singletonKey: { type: String, required: true, unique: true, default: 'default' },
    heroTitle: { type: String, required: true, trim: true },
    heroSubtitle: { type: String, default: '' },
    heroCtaLabel: { type: String, default: 'Request a demo' },
    features: { type: [sectionSchema], default: [] },
    pricingTitle: { type: String, default: null },
    pricingBody: { type: String, default: null },
    faq: { type: [sectionSchema], default: [] },
    footerNote: { type: String, default: null },
  },
  { timestamps: true, collection: 'platform_marketing' },
);

export type PlatformMarketingDocument = InferSchemaType<typeof platformMarketingSchema> & {
  _id: Types.ObjectId;
};

export const PlatformMarketingModel = model('PlatformMarketing', platformMarketingSchema);
