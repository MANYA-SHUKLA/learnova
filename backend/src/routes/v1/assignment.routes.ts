import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  assignmentExportQuerySchema,
  assignmentFileUploadSchema,
  assignmentIdParamsSchema,
  assignmentImportConfirmSchema,
  assignmentListQuerySchema,
  assignmentSearchQuerySchema,
  createAssignmentSchema,
  createCommentSchema,
  createRubricSchema,
  gradeSubmissionSchema,
  rubricIdParamsSchema,
  saveSubmissionDraftSchema,
  submissionIdParamsSchema,
  submissionListQuerySchema,
  submitAssignmentSchema,
  updateAssignmentSchema,
  updateRubricSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/assignment/assignment.controller.js';

const assignmentRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.ASSIGNMENT_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.ASSIGNMENT_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.ASSIGNMENT_MANAGE),
] as RequestHandler[];

/** Comments take the assignment id from the path, not the body. */
const commentBodySchema = createCommentSchema.omit({ assignmentId: true });

// ------------------------------------------------------------------ collection

assignmentRoutes.get(
  '/assignments',
  ...readAuth,
  validate(assignmentListQuerySchema, 'query'),
  ctrl.listAssignments,
);

assignmentRoutes.get(
  '/assignments/search',
  ...readAuth,
  validate(assignmentSearchQuerySchema, 'query'),
  ctrl.searchAssignments,
);

assignmentRoutes.get('/assignments/stats', ...manageAuth, ctrl.getAssignmentStats);

assignmentRoutes.get('/assignments/audit', ...manageAuth, ctrl.listAssignmentAudit);

assignmentRoutes.get('/assignments/dashboard/faculty', ...readAuth, ctrl.facultyDashboard);

assignmentRoutes.get('/assignments/dashboard/student', ...readAuth, ctrl.studentDashboard);

assignmentRoutes.get(
  '/assignments/dashboard/institution',
  ...manageAuth,
  ctrl.institutionDashboard,
);

assignmentRoutes.get(
  '/assignments/export',
  ...readAuth,
  validate(assignmentExportQuerySchema, 'query'),
  ctrl.exportAssignments,
);

assignmentRoutes.get(
  '/assignments/me',
  ...readAuth,
  validate(assignmentListQuerySchema, 'query'),
  ctrl.getOwnAssignments,
);

// ------------------------------------------------------------------ rubrics

assignmentRoutes.get(
  '/assignments/rubrics',
  ...readAuth,
  validate(assignmentSearchQuerySchema, 'query'),
  ctrl.listRubrics,
);

assignmentRoutes.post(
  '/assignments/rubrics',
  ...writeAuth,
  validate(createRubricSchema),
  ctrl.createRubric,
);

assignmentRoutes.get(
  '/assignments/rubrics/:id',
  ...readAuth,
  validate(rubricIdParamsSchema, 'params'),
  ctrl.getRubric,
);

assignmentRoutes.patch(
  '/assignments/rubrics/:id',
  ...writeAuth,
  validate(rubricIdParamsSchema, 'params'),
  validate(updateRubricSchema),
  ctrl.updateRubric,
);

assignmentRoutes.delete(
  '/assignments/rubrics/:id',
  ...writeAuth,
  validate(rubricIdParamsSchema, 'params'),
  ctrl.deleteRubric,
);

// ------------------------------------------------------------------ submissions

assignmentRoutes.get(
  '/assignments/submissions',
  ...readAuth,
  validate(submissionListQuerySchema, 'query'),
  ctrl.listSubmissions,
);

assignmentRoutes.post(
  '/assignments/submissions/draft',
  ...writeAuth,
  validate(saveSubmissionDraftSchema),
  ctrl.saveSubmissionDraft,
);

assignmentRoutes.post(
  '/assignments/submissions/submit',
  ...writeAuth,
  validate(submitAssignmentSchema),
  ctrl.submitAssignment,
);

assignmentRoutes.get(
  '/assignments/submissions/:id',
  ...readAuth,
  validate(submissionIdParamsSchema, 'params'),
  ctrl.getSubmission,
);

assignmentRoutes.post(
  '/assignments/submissions/:id/grade',
  ...writeAuth,
  validate(submissionIdParamsSchema, 'params'),
  validate(gradeSubmissionSchema),
  ctrl.gradeSubmission,
);

assignmentRoutes.post(
  '/assignments/submissions/:id/files',
  ...writeAuth,
  validate(submissionIdParamsSchema, 'params'),
  validate(assignmentFileUploadSchema),
  ctrl.uploadSubmissionFile,
);

// ------------------------------------------------------------------ import

assignmentRoutes.post(
  '/assignments/import',
  ...manageAuth,
  validate(assignmentImportConfirmSchema),
  ctrl.importAssignments,
);

// ------------------------------------------------------------------ item

assignmentRoutes.post(
  '/assignments',
  ...writeAuth,
  validate(createAssignmentSchema),
  ctrl.createAssignment,
);

assignmentRoutes.get(
  '/assignments/:id',
  ...readAuth,
  validate(assignmentIdParamsSchema, 'params'),
  ctrl.getAssignment,
);

assignmentRoutes.patch(
  '/assignments/:id',
  ...writeAuth,
  validate(assignmentIdParamsSchema, 'params'),
  validate(updateAssignmentSchema),
  ctrl.updateAssignment,
);

assignmentRoutes.delete(
  '/assignments/:id',
  ...writeAuth,
  validate(assignmentIdParamsSchema, 'params'),
  ctrl.deleteAssignment,
);

assignmentRoutes.post(
  '/assignments/:id/publish',
  ...writeAuth,
  validate(assignmentIdParamsSchema, 'params'),
  ctrl.publishAssignment,
);

assignmentRoutes.post(
  '/assignments/:id/archive',
  ...writeAuth,
  validate(assignmentIdParamsSchema, 'params'),
  ctrl.archiveAssignment,
);

assignmentRoutes.post(
  '/assignments/:id/close',
  ...writeAuth,
  validate(assignmentIdParamsSchema, 'params'),
  ctrl.closeAssignment,
);

assignmentRoutes.post(
  '/assignments/:id/attachments',
  ...writeAuth,
  validate(assignmentIdParamsSchema, 'params'),
  validate(assignmentFileUploadSchema),
  ctrl.uploadAssignmentAttachment,
);

assignmentRoutes.get(
  '/assignments/:id/comments',
  ...readAuth,
  validate(assignmentIdParamsSchema, 'params'),
  ctrl.listComments,
);

assignmentRoutes.post(
  '/assignments/:id/comments',
  ...writeAuth,
  validate(assignmentIdParamsSchema, 'params'),
  validate(commentBodySchema),
  ctrl.addComment,
);

export default assignmentRoutes;
