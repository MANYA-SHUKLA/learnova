import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { PROJECT_TEAM_MEMBER_ROLES, PROJECT_TEAM_STATUSES } from '@learnova/constants';

export { PROJECT_TEAM_STATUSES, PROJECT_TEAM_MEMBER_ROLES };

const teamMemberSchema = new Schema(
  {
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
  },
  { _id: true },
);

const projectTeamSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    status: {
      type: String,
      enum: PROJECT_TEAM_STATUSES,
      default: 'forming',
      index: true,
    },
    leaderId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    memberCount: { type: Number, default: 0, min: 0 },
    repoLink: { type: String, default: null },
    members: { type: [teamMemberSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'project_teams' },
);

projectTeamSchema.index({ institutionId: 1, projectId: 1, status: 1, deletedAt: 1 });
projectTeamSchema.index({ projectId: 1, 'members.studentId': 1, deletedAt: 1 });

export type ProjectTeamDocument = InferSchemaType<typeof projectTeamSchema> & {
  _id: Types.ObjectId;
};

export const ProjectTeamModel = model('ProjectTeam', projectTeamSchema);
