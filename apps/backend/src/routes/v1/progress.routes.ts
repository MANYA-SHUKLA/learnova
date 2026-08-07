import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  progressListQuerySchema,
  courseProgressParamsSchema,
  openLessonSchema,
  completeLessonSchema,
  updateLessonProgressSchema,
  resourceProgressUpdateSchema,
  startLearningSessionSchema,
  endLearningSessionSchema,
  createBookmarkSchema,
  bookmarkIdParamsSchema,
  bookmarkListQuerySchema,
  createNoteSchema,
  updateNoteSchema,
  noteIdParamsSchema,
  noteListQuerySchema,
  activityListQuerySchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/progress/progress.controller.js';

const progressRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.PROGRESS_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.PROGRESS_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.PROGRESS_MANAGE),
] as RequestHandler[];

progressRoutes.get(
  '/progress/me',
  ...readAuth,
  validate(progressListQuerySchema, 'query'),
  ctrl.listMyProgress,
);

progressRoutes.get(
  '/progress/course/:courseId',
  ...readAuth,
  validate(courseProgressParamsSchema, 'params'),
  ctrl.getCourseProgress,
);

progressRoutes.get(
  '/progress/resume/:courseId',
  ...readAuth,
  validate(courseProgressParamsSchema, 'params'),
  ctrl.getResume,
);

progressRoutes.post(
  '/progress/lessons/open',
  ...writeAuth,
  validate(openLessonSchema),
  ctrl.openLesson,
);

progressRoutes.post(
  '/progress/lessons/complete',
  ...writeAuth,
  validate(completeLessonSchema),
  ctrl.completeLesson,
);

progressRoutes.patch(
  '/progress/lessons',
  ...writeAuth,
  validate(updateLessonProgressSchema),
  ctrl.updateLessonProgress,
);

progressRoutes.post(
  '/progress/resources',
  ...writeAuth,
  validate(resourceProgressUpdateSchema),
  ctrl.updateResourceProgress,
);

progressRoutes.post(
  '/progress/sessions/start',
  ...writeAuth,
  validate(startLearningSessionSchema),
  ctrl.startSession,
);

progressRoutes.post(
  '/progress/sessions/end',
  ...writeAuth,
  validate(endLearningSessionSchema),
  ctrl.endSession,
);

progressRoutes.get(
  '/progress/bookmarks',
  ...readAuth,
  validate(bookmarkListQuerySchema, 'query'),
  ctrl.listBookmarks,
);

progressRoutes.post(
  '/progress/bookmarks',
  ...writeAuth,
  validate(createBookmarkSchema),
  ctrl.createBookmark,
);

progressRoutes.delete(
  '/progress/bookmarks/:id',
  ...writeAuth,
  validate(bookmarkIdParamsSchema, 'params'),
  ctrl.deleteBookmark,
);

progressRoutes.get(
  '/progress/notes/export',
  ...readAuth,
  ctrl.exportNotes,
);

progressRoutes.get(
  '/progress/notes',
  ...readAuth,
  validate(noteListQuerySchema, 'query'),
  ctrl.listNotes,
);

progressRoutes.post(
  '/progress/notes',
  ...writeAuth,
  validate(createNoteSchema),
  ctrl.createNote,
);

progressRoutes.patch(
  '/progress/notes/:id',
  ...writeAuth,
  validate(noteIdParamsSchema, 'params'),
  validate(updateNoteSchema),
  ctrl.updateNote,
);

progressRoutes.delete(
  '/progress/notes/:id',
  ...writeAuth,
  validate(noteIdParamsSchema, 'params'),
  ctrl.deleteNote,
);

progressRoutes.get(
  '/progress/activity',
  ...readAuth,
  validate(activityListQuerySchema, 'query'),
  ctrl.listActivity,
);

progressRoutes.get('/progress/dashboard/student', ...readAuth, ctrl.studentDashboard);

progressRoutes.get('/progress/dashboard/faculty', ...readAuth, ctrl.facultyDashboard);

progressRoutes.get(
  '/progress/dashboard/institution',
  ...manageAuth,
  ctrl.institutionDashboard,
);

progressRoutes.get('/progress/stats', ...readAuth, ctrl.getProgressStats);

progressRoutes.get('/progress/search', ...readAuth, ctrl.searchProgress);

export default progressRoutes;
