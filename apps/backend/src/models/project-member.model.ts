import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import {
  PROJECT_MEMBER_INVITATION_STATUSES,
  PROJECT_TEAM_MEMBER_ROLES,
} from '@learnova/constants';

export { PROJECT_TEAM_MEMBER_ROLES, PROJECT_MEMBER_INVITATION_STATUSES };

const projectMemberSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectTeam',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: PROJECT_TEAM_MEMBER_ROLES,
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    invitationStatus: {
      type: String,
      enum: PROJECT_MEMBER_INVITATION_STATUSES,
      default: 'accepted',
      index: true,
    },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'project_members' },
);

projectMemberSchema.index(
  { teamId: 1, studentId: 1, deletedAt: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
projectMemberSchema.index({ projectId: 1, studentId: 1, deletedAt: 1 });

export type ProjectMemberDocument = InferSchemaType<typeof projectMemberSchema> & {
  _id: Types.ObjectId;
};

export const ProjectMemberModel = model('ProjectMember', projectMemberSchema);
