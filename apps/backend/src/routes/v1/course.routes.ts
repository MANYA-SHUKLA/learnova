import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import * as ctrl from '../../controllers/course/course.controller.js';

const courseRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.COURSE_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.COURSE_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.COURSE_MANAGE),
] as RequestHandler[];

courseRoutes.get('/courses', ...readAuth, ctrl.listCourses);
courseRoutes.get('/courses/stats', ...readAuth, ctrl.getCourseStats);
courseRoutes.get('/courses/:id', ...readAuth, ctrl.getCourse);

courseRoutes.post('/courses', ...manageAuth, ctrl.createCourse);
courseRoutes.patch('/courses/:id', ...writeAuth, ctrl.updateCourse);
courseRoutes.delete('/courses/:id', ...manageAuth, ctrl.deleteCourse);

courseRoutes.post('/courses/:id/publish', ...manageAuth, ctrl.publishCourse);
courseRoutes.post('/courses/:id/archive', ...manageAuth, ctrl.archiveCourse);

export default courseRoutes;
