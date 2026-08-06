import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const campusSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    phone: { type: String, default: null },
    email: { type: String, default: null, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'campuses' },
);

campusSchema.index({ institutionId: 1, code: 1 }, { unique: true });

export type CampusDocument = InferSchemaType<typeof campusSchema> & {
  _id: Types.ObjectId;
};

export const CampusModel = model('Campus', campusSchema);
