import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const institutionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    shortName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: null },
    website: { type: String, default: null },
    logo: { type: String, default: null },
    favicon: { type: String, default: null },
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    country: { type: String, default: null },
    state: { type: String, default: null },
    city: { type: String, default: null },
    postalCode: { type: String, default: null },
    address: { type: String, default: null },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    subscriptionPlan: { type: String, default: null },
    subscriptionStart: { type: Date, default: null },
    subscriptionEnd: { type: Date, default: null },
    maxStudents: { type: Number, default: null },
    maxFaculty: { type: Number, default: null },
    maxStorage: { type: Number, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'institutions' },
);

institutionSchema.index({ slug: 1 }, { unique: true });
institutionSchema.index({ code: 1 }, { unique: true });
institutionSchema.index({ email: 1 }, { unique: true });

export type InstitutionDocument = InferSchemaType<typeof institutionSchema> & {
  _id: Types.ObjectId;
};

export const InstitutionModel = model('Institution', institutionSchema);
