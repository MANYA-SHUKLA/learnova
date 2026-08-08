import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'student',
        'faculty',
        'institution_admin',
        'super_admin',
        'teaching_assistant',
        'placement_officer',
        'parent',
      ],
    },
    label: { type: String, required: true },
    description: { type: String, required: true },
    permissionIds: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    isActive: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'roles' },
);

export type RoleDocument = InferSchemaType<typeof roleSchema> & {
  _id: Types.ObjectId;
};

export const RoleModel = model('Role', roleSchema);
