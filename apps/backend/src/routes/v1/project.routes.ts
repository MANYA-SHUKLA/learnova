import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  createMilestoneSchema,
  createProjectSchema,
  createReviewSchema,
  createTeamSchema,
  gradeProjectSubmissionSchema,
  joinTeamSchema,
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
  saveSubmissionDraftSchema,
  submissionListQuerySchema,
  submitProjectSchema,
  submitReviewSchema,
  teamListQuerySchema,
  updateMilestoneSchema,
  updateProjectSchema,
  updateTeamSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/project/project.controller.js';

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
  validate(submissionListQuerySchema, 'query'),
  ctrl.listSubmissions,
);

projectRoutes.post(
  '/projects/submissions/draft',
  ...writeAuth,
  validate(saveSubmissionDraftSchema),
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
  '/projects/submissions/:id/grade',
  ...writeAuth,
  validate(projectSubmissionIdParamsSchema, 'params'),
  validate(gradeProjectSubmissionSchema),
  ctrl.gradeSubmission,
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
