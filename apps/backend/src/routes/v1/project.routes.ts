import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  bulkAssignFacultySchema,
  bulkProjectIdsSchema,
  createCategorySchema,
  createMilestoneSchema,
  createProjectCommentSchema,
  createProjectSchema,
  createReviewSchema,
  createTagSchema,
  createTeamSchema,
  markEvaluationReadySchema,
  inviteMemberSchema,
  joinTeamSchema,
  projectCommentIdParamsSchema,
  projectExportQuerySchema,
  projectFileUploadSchema,
  projectIdParamsSchema,
  projectImportConfirmSchema,
  projectListQuerySchema,
  projectMilestoneIdParamsSchema,
  projectReviewIdParamsSchema,
  projectSearchQuerySchema,
  projectSubmissionIdParamsSchema,
  projectTeamIdParamsSchema,
  projectSubmissionListQuerySchema,
  saveProjectSubmissionDraftSchema,
  submitProjectSchema,
  submitReviewSchema,
  teamListQuerySchema,
  transferLeadershipSchema,
  updateMilestoneSchema,
  updateProjectSchema,
  updateTeamSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/project/project.controller.js';

const projectCommentBodySchema = createProjectCommentSchema.omit({ projectId: true });

const projectRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.PROJECT_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.PROJECT_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.PROJECT_MANAGE),
] as RequestHandler[];

projectRoutes.get('/projects/my-team', ...readAuth, ctrl.getMyTeams);

projectRoutes.get('/projects/tags', ...readAuth, ctrl.listProjectTags);

projectRoutes.post(
  '/projects/tags',
  ...writeAuth,
  validate(createTagSchema),
  ctrl.createProjectTag,
);

projectRoutes.get('/projects/categories', ...readAuth, ctrl.listProjectCategories);

projectRoutes.post(
  '/projects/categories',
  ...writeAuth,
  validate(createCategorySchema),
  ctrl.createProjectCategory,
);

projectRoutes.post(
  '/projects/bulk/publish',
  ...writeAuth,
  validate(bulkProjectIdsSchema),
  ctrl.bulkPublishProjects,
);

projectRoutes.post(
  '/projects/bulk/archive',
  ...writeAuth,
  validate(bulkProjectIdsSchema),
  ctrl.bulkArchiveProjects,
);

projectRoutes.post(
  '/projects/bulk/delete',
  ...writeAuth,
  validate(bulkProjectIdsSchema),
  ctrl.bulkDeleteProjects,
);

projectRoutes.post(
  '/projects/bulk/duplicate',
  ...writeAuth,
  validate(bulkProjectIdsSchema),
  ctrl.bulkDuplicateProjects,
);

projectRoutes.post(
  '/projects/bulk/assign-faculty',
  ...manageAuth,
  validate(bulkAssignFacultySchema),
  ctrl.bulkAssignFacultyProjects,
);

// ------------------------------------------------------------------ collection

projectRoutes.get(
  '/projects',
  ...readAuth,
  validate(projectListQuerySchema, 'query'),
  ctrl.listProjects,
);

projectRoutes.get(
  '/projects/search',
  ...readAuth,
  validate(projectSearchQuerySchema, 'query'),
  ctrl.searchProjects,
);

projectRoutes.get('/projects/stats', ...manageAuth, ctrl.getProjectStats);

projectRoutes.get('/projects/audit', ...manageAuth, ctrl.listProjectAudit);

projectRoutes.get('/projects/dashboard/faculty', ...readAuth, ctrl.facultyDashboard);

projectRoutes.get('/projects/dashboard/student', ...readAuth, ctrl.studentDashboard);

projectRoutes.get(
  '/projects/dashboard/institution',
  ...manageAuth,
  ctrl.institutionDashboard,
);

projectRoutes.get(
  '/projects/export',
  ...readAuth,
  validate(projectExportQuerySchema, 'query'),
  ctrl.exportProjects,
);

projectRoutes.get(
  '/projects/me',
  ...readAuth,
  validate(projectListQuerySchema, 'query'),
  ctrl.getOwnProjects,
);

// ------------------------------------------------------------------- milestones

projectRoutes.get('/projects/milestones', ...readAuth, ctrl.listMilestones);

projectRoutes.post(
  '/projects/milestones',
  ...writeAuth,
  validate(createMilestoneSchema),
  ctrl.createMilestone,
);

projectRoutes.patch(
  '/projects/milestones/:id',
  ...writeAuth,
  validate(projectMilestoneIdParamsSchema, 'params'),
  validate(updateMilestoneSchema),
  ctrl.updateMilestone,
);

projectRoutes.delete(
  '/projects/milestones/:id',
  ...writeAuth,
  validate(projectMilestoneIdParamsSchema, 'params'),
  ctrl.deleteMilestone,
);

projectRoutes.post(
  '/projects/milestones/:id/complete',
  ...writeAuth,
  validate(projectMilestoneIdParamsSchema, 'params'),
  ctrl.completeMilestone,
);

// ------------------------------------------------------------------------- teams

projectRoutes.get(
  '/projects/teams',
  ...readAuth,
  validate(teamListQuerySchema, 'query'),
  ctrl.listTeams,
);

projectRoutes.post('/projects/teams', ...writeAuth, validate(createTeamSchema), ctrl.createTeam);

projectRoutes.post('/projects/teams/join', ...writeAuth, validate(joinTeamSchema), ctrl.joinTeam);

projectRoutes.get(
  '/projects/teams/:id',
  ...readAuth,
  validate(projectTeamIdParamsSchema, 'params'),
  ctrl.getTeam,
);

projectRoutes.patch(
  '/projects/teams/:id',
  ...writeAuth,
  validate(projectTeamIdParamsSchema, 'params'),
  validate(updateTeamSchema),
  ctrl.updateTeam,
);

projectRoutes.post(
  '/projects/teams/:id/leave',
  ...writeAuth,
  validate(projectTeamIdParamsSchema, 'params'),
  ctrl.leaveTeam,
);

projectRoutes.post(
  '/projects/teams/:id/approve',
  ...writeAuth,
  validate(projectTeamIdParamsSchema, 'params'),
  ctrl.approveTeam,
);

projectRoutes.post(
  '/projects/teams/:id/reject',
  ...writeAuth,
  validate(projectTeamIdParamsSchema, 'params'),
  ctrl.rejectTeam,
);

projectRoutes.post(
  '/projects/teams/:id/invite',
  ...writeAuth,
  validate(projectTeamIdParamsSchema, 'params'),
  validate(inviteMemberSchema.omit({ teamId: true })),
  ctrl.inviteTeamMember,
);

projectRoutes.post(
  '/projects/teams/:id/transfer-leadership',
  ...writeAuth,
  validate(projectTeamIdParamsSchema, 'params'),
  validate(transferLeadershipSchema.omit({ teamId: true })),
  ctrl.transferTeamLeadership,
);

projectRoutes.post(
  '/projects/members/:id/accept',
  ...writeAuth,
  validate(projectCommentIdParamsSchema, 'params'),
  ctrl.acceptMemberInvitation,
);

projectRoutes.post(
  '/projects/members/:id/reject',
  ...writeAuth,
  validate(projectCommentIdParamsSchema, 'params'),
  ctrl.rejectMemberInvitation,
);

projectRoutes.delete(
  '/projects/teams/:id/members/:studentId',
  ...writeAuth,
  validate(projectTeamIdParamsSchema, 'params'),
  ctrl.removeTeamMember,
);

// ------------------------------------------------------------------ submissions

projectRoutes.get(
  '/projects/submissions',
  ...readAuth,
  validate(projectSubmissionListQuerySchema, 'query'),
  ctrl.listSubmissions,
);

projectRoutes.post(
  '/projects/submissions/draft',
  ...writeAuth,
  validate(saveProjectSubmissionDraftSchema),
  ctrl.saveSubmissionDraft,
);

projectRoutes.post(
  '/projects/submissions/submit',
  ...writeAuth,
  validate(submitProjectSchema),
  ctrl.submitProject,
);

projectRoutes.get(
  '/projects/submissions/:id',
  ...readAuth,
  validate(projectSubmissionIdParamsSchema, 'params'),
  ctrl.getSubmission,
);

projectRoutes.post(
  '/projects/submissions/:id/mark-evaluation-ready',
  ...writeAuth,
  validate(projectSubmissionIdParamsSchema, 'params'),
  validate(markEvaluationReadySchema),
  ctrl.markEvaluationReady,
);

projectRoutes.post(
  '/projects/submissions/:id/files',
  ...writeAuth,
  validate(projectSubmissionIdParamsSchema, 'params'),
  validate(projectFileUploadSchema),
  ctrl.uploadSubmissionFile,
);

// ---------------------------------------------------------------------- reviews

projectRoutes.post(
  '/projects/reviews',
  ...writeAuth,
  validate(createReviewSchema),
  ctrl.createReview,
);

projectRoutes.get(
  '/projects/reviews/:id',
  ...readAuth,
  validate(projectReviewIdParamsSchema, 'params'),
  ctrl.getReview,
);

projectRoutes.post(
  '/projects/reviews/:id/submit',
  ...writeAuth,
  validate(projectReviewIdParamsSchema, 'params'),
  validate(submitReviewSchema),
  ctrl.submitReview,
);

// ---------------------------------------------------------------------- import

projectRoutes.post(
  '/projects/import',
  ...manageAuth,
  validate(projectImportConfirmSchema),
  ctrl.importProjects,
);

// --------------------------------------------------------------------- comments

projectRoutes.get(
  '/projects/:id/comments',
  ...readAuth,
  validate(projectIdParamsSchema, 'params'),
  ctrl.listProjectComments,
);

projectRoutes.post(
  '/projects/:id/comments',
  ...writeAuth,
  validate(projectIdParamsSchema, 'params'),
  validate(projectCommentBodySchema),
  ctrl.createProjectComment,
);

projectRoutes.patch(
  '/projects/comments/:id/resolve',
  ...writeAuth,
  validate(projectCommentIdParamsSchema, 'params'),
  ctrl.resolveProjectComment,
);

// ------------------------------------------------------------------------- item

projectRoutes.post(
  '/projects',
  ...writeAuth,
  validate(createProjectSchema),
  ctrl.createProject,
);

projectRoutes.get(
  '/projects/:id',
  ...readAuth,
  validate(projectIdParamsSchema, 'params'),
  ctrl.getProject,
);

projectRoutes.patch(
  '/projects/:id',
  ...writeAuth,
  validate(projectIdParamsSchema, 'params'),
  validate(updateProjectSchema),
  ctrl.updateProject,
);

projectRoutes.delete(
  '/projects/:id',
  ...writeAuth,
  validate(projectIdParamsSchema, 'params'),
  ctrl.deleteProject,
);

projectRoutes.post(
  '/projects/:id/publish',
  ...writeAuth,
  validate(projectIdParamsSchema, 'params'),
  ctrl.publishProject,
);

projectRoutes.post(
  '/projects/:id/archive',
  ...writeAuth,
  validate(projectIdParamsSchema, 'params'),
  ctrl.archiveProject,
);

projectRoutes.post(
  '/projects/:id/close',
  ...writeAuth,
  validate(projectIdParamsSchema, 'params'),
  ctrl.closeProject,
);

projectRoutes.post(
  '/projects/:id/duplicate',
  ...writeAuth,
  validate(projectIdParamsSchema, 'params'),
  ctrl.duplicateProject,
);

projectRoutes.post(
  '/projects/:id/attachments',
  ...writeAuth,
  validate(projectIdParamsSchema, 'params'),
  validate(projectFileUploadSchema),
  ctrl.uploadProjectAttachment,
);

export default projectRoutes;
