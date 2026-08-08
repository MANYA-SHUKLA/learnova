import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import institutionRoutes from './institution.routes.js';
import facultyRoutes from './faculty.routes.js';
import studentRoutes from './student.routes.js';
import courseRoutes from './course.routes.js';
import { courseBuilderRoutes } from './course-builder.routes.js';
import enrollmentRoutes from './enrollment.routes.js';
import progressRoutes from './progress.routes.js';
import assignmentRoutes from './assignment.routes.js';
import quizRoutes from './quiz.routes.js';
import examinationRoutes from './examination.routes.js';
import gradebookRoutes from './gradebook.routes.js';
import certificateRoutes from './certificate.routes.js';
import reportsRoutes from './reports.routes.js';
import projectRoutes from './project.routes.js';
import practiceLabRoutes from './practice-lab.routes.js';
import {
  healthCheck,
  livenessCheck,
  readinessCheck,
  versionCheck,
} from '../../controllers/health/health.controller.js';

/**
 * API v1 router.
 * Also exposes top-level aliases: /api/v1/live, /ready, /version
 */
const v1Router = Router();

v1Router.use('/health', healthRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use(institutionRoutes);
v1Router.use(facultyRoutes);
v1Router.use(studentRoutes);
v1Router.use(courseRoutes);
v1Router.use(courseBuilderRoutes);
v1Router.use(enrollmentRoutes);
v1Router.use(progressRoutes);
v1Router.use(assignmentRoutes);
v1Router.use(quizRoutes);
v1Router.use(examinationRoutes);
v1Router.use(gradebookRoutes);
v1Router.use(certificateRoutes);
v1Router.use(reportsRoutes);
v1Router.use(projectRoutes);
v1Router.use(practiceLabRoutes);
v1Router.get('/live', livenessCheck);
v1Router.get('/ready', readinessCheck);
v1Router.get('/version', versionCheck);
v1Router.get('/healthz', healthCheck);

export default v1Router;
