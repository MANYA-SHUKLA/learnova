import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  builderCourseParamsSchema,
  builderModuleParamsSchema,
  builderLessonParamsSchema,
  builderResourceParamsSchema,
  createCourseModuleSchema,
  updateCourseModuleSchema,
  createCourseLessonSchema,
  updateCourseLessonSchema,
  createCourseResourceSchema,
  updateCourseResourceSchema,
  builderReorderSchema,
  builderSearchQuerySchema,
  moveLessonSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/course-builder/course-builder.controller.js';

const courseBuilderRoutes = Router();

const writeAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.COURSE_WRITE),
] as RequestHandler[];

courseBuilderRoutes.get(
  '/courses/:courseId/builder',
  ...writeAuth,
  validate(builderCourseParamsSchema, 'params'),
  ctrl.getBuilderTree,
);

courseBuilderRoutes.get(
  '/courses/:courseId/builder/search',
  ...writeAuth,
  validate(builderCourseParamsSchema, 'params'),
  validate(builderSearchQuerySchema, 'query'),
  ctrl.searchBuilder,
);

courseBuilderRoutes.post(
  '/courses/:courseId/builder/reorder',
  ...writeAuth,
  validate(builderCourseParamsSchema, 'params'),
  validate(builderReorderSchema),
  ctrl.reorder,
);

courseBuilderRoutes.get(
  '/courses/:courseId/modules',
  ...writeAuth,
  validate(builderCourseParamsSchema, 'params'),
  ctrl.listModules,
);

courseBuilderRoutes.post(
  '/courses/:courseId/modules',
  ...writeAuth,
  validate(builderCourseParamsSchema, 'params'),
  validate(createCourseModuleSchema),
  ctrl.createModule,
);

courseBuilderRoutes.get(
  '/courses/:courseId/modules/:moduleId',
  ...writeAuth,
  validate(builderModuleParamsSchema, 'params'),
  ctrl.getModule,
);

courseBuilderRoutes.patch(
  '/courses/:courseId/modules/:moduleId',
  ...writeAuth,
  validate(builderModuleParamsSchema, 'params'),
  validate(updateCourseModuleSchema),
  ctrl.updateModule,
);

courseBuilderRoutes.delete(
  '/courses/:courseId/modules/:moduleId',
  ...writeAuth,
  validate(builderModuleParamsSchema, 'params'),
  ctrl.deleteModule,
);

courseBuilderRoutes.post(
  '/courses/:courseId/modules/:moduleId/restore',
  ...writeAuth,
  validate(builderModuleParamsSchema, 'params'),
  ctrl.restoreModule,
);

courseBuilderRoutes.post(
  '/courses/:courseId/modules/:moduleId/duplicate',
  ...writeAuth,
  validate(builderModuleParamsSchema, 'params'),
  ctrl.duplicateModule,
);

courseBuilderRoutes.post(
  '/courses/:courseId/modules/:moduleId/archive',
  ...writeAuth,
  validate(builderModuleParamsSchema, 'params'),
  ctrl.archiveModule,
);

courseBuilderRoutes.get(
  '/courses/:courseId/lessons',
  ...writeAuth,
  validate(builderCourseParamsSchema, 'params'),
  ctrl.listLessons,
);

courseBuilderRoutes.post(
  '/courses/:courseId/lessons',
  ...writeAuth,
  validate(builderCourseParamsSchema, 'params'),
  validate(createCourseLessonSchema),
  ctrl.createLesson,
);

courseBuilderRoutes.get(
  '/courses/:courseId/lessons/:lessonId',
  ...writeAuth,
  validate(builderLessonParamsSchema, 'params'),
  ctrl.getLesson,
);

courseBuilderRoutes.patch(
  '/courses/:courseId/lessons/:lessonId',
  ...writeAuth,
  validate(builderLessonParamsSchema, 'params'),
  validate(updateCourseLessonSchema),
  ctrl.updateLesson,
);

courseBuilderRoutes.delete(
  '/courses/:courseId/lessons/:lessonId',
  ...writeAuth,
  validate(builderLessonParamsSchema, 'params'),
  ctrl.deleteLesson,
);

courseBuilderRoutes.post(
  '/courses/:courseId/lessons/:lessonId/restore',
  ...writeAuth,
  validate(builderLessonParamsSchema, 'params'),
  ctrl.restoreLesson,
);

courseBuilderRoutes.post(
  '/courses/:courseId/lessons/:lessonId/duplicate',
  ...writeAuth,
  validate(builderLessonParamsSchema, 'params'),
  ctrl.duplicateLesson,
);

courseBuilderRoutes.post(
  '/courses/:courseId/lessons/:lessonId/archive',
  ...writeAuth,
  validate(builderLessonParamsSchema, 'params'),
  ctrl.archiveLesson,
);

courseBuilderRoutes.post(
  '/courses/:courseId/lessons/:lessonId/move',
  ...writeAuth,
  validate(builderLessonParamsSchema, 'params'),
  validate(moveLessonSchema),
  ctrl.moveLesson,
);

courseBuilderRoutes.get(
  '/courses/:courseId/lessons/:lessonId/versions',
  ...writeAuth,
  validate(builderLessonParamsSchema, 'params'),
  ctrl.listLessonVersions,
);

courseBuilderRoutes.get(
  '/courses/:courseId/lessons/:lessonId/resources',
  ...writeAuth,
  validate(builderLessonParamsSchema, 'params'),
  ctrl.listResources,
);

courseBuilderRoutes.post(
  '/courses/:courseId/lessons/:lessonId/resources',
  ...writeAuth,
  validate(builderLessonParamsSchema, 'params'),
  validate(createCourseResourceSchema),
  ctrl.createResource,
);

courseBuilderRoutes.patch(
  '/courses/:courseId/lessons/:lessonId/resources/:resourceId',
  ...writeAuth,
  validate(builderResourceParamsSchema, 'params'),
  validate(updateCourseResourceSchema),
  ctrl.updateResource,
);

courseBuilderRoutes.delete(
  '/courses/:courseId/lessons/:lessonId/resources/:resourceId',
  ...writeAuth,
  validate(builderResourceParamsSchema, 'params'),
  ctrl.deleteResource,
);

export { courseBuilderRoutes };
