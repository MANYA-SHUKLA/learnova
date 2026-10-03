import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import type { Permission } from '@learnova/types';
import {
  acceptBlueprintSchema,
  acceptOutlineSchema,
  acceptQuizSchema,
  aiCourseParamsSchema,
  generateBlueprintSchema,
  generateOutlineSchema,
  generateQuizSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/ai/ai-content.controller.js';

const aiRoutes = Router();

function writeAuth(permission: Permission): RequestHandler[] {
  return [authenticate({ required: true }), requirePermission(permission)];
}

aiRoutes.post(
  '/courses/:courseId/outline',
  ...writeAuth(PERMISSIONS.COURSE_WRITE),
  validate(aiCourseParamsSchema, 'params'),
  validate(generateOutlineSchema),
  ctrl.generateOutline,
);

aiRoutes.post(
  '/courses/:courseId/outline/accept',
  ...writeAuth(PERMISSIONS.COURSE_WRITE),
  validate(aiCourseParamsSchema, 'params'),
  validate(acceptOutlineSchema),
  ctrl.acceptOutline,
);

aiRoutes.post(
  '/courses/:courseId/quiz',
  ...writeAuth(PERMISSIONS.QUIZ_WRITE),
  validate(aiCourseParamsSchema, 'params'),
  validate(generateQuizSchema),
  ctrl.generateQuiz,
);

aiRoutes.post(
  '/courses/:courseId/quiz/accept',
  ...writeAuth(PERMISSIONS.QUIZ_WRITE),
  validate(aiCourseParamsSchema, 'params'),
  validate(acceptQuizSchema),
  ctrl.acceptQuiz,
);

aiRoutes.post(
  '/courses/:courseId/exam-blueprint',
  ...writeAuth(PERMISSIONS.EXAMINATION_WRITE),
  validate(aiCourseParamsSchema, 'params'),
  validate(generateBlueprintSchema),
  ctrl.generateBlueprint,
);

aiRoutes.post(
  '/courses/:courseId/exam-blueprint/accept',
  ...writeAuth(PERMISSIONS.EXAMINATION_WRITE),
  validate(aiCourseParamsSchema, 'params'),
  validate(acceptBlueprintSchema),
  ctrl.acceptBlueprint,
);

export default aiRoutes;
