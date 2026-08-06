import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const permissionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    resource: { type: String, required: true, index: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true, collection: 'permissions' },
);

permissionSchema.index({ resource: 1, action: 1 }, { unique: true });

export type PermissionDocument = InferSchemaType<typeof permissionSchema> & {
  _id: Types.ObjectId;
};

export const PermissionModel = model('Permission', permissionSchema);
