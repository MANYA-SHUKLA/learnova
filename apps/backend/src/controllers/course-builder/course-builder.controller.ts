import type { NextFunction, Request, Response } from 'express';
import type {
  CreateCourseModuleInput,
  UpdateCourseModuleInput,
  CreateCourseLessonInput,
  UpdateCourseLessonInput,
  CreateCourseResourceInput,
  UpdateCourseResourceInput,
  BuilderReorderInput,
  BuilderSearchQuery,
  MoveLessonInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import {
  courseBuilderService,
  type ActorContext,
} from '../../services/course-builder/course-builder.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function getBuilderTree(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.getBuilderTree(
      req.params.courseId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function searchBuilder(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.searchBuilder(
      req.params.courseId as string,
      req.query as unknown as BuilderSearchQuery,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function reorder(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.reorder(
      req.params.courseId as string,
      req.body as BuilderReorderInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listModules(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.listModules(
      req.params.courseId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createModule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.createModule(
      req.params.courseId as string,
      req.body as CreateCourseModuleInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getModule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.getModule(
      req.params.courseId as string,
      req.params.moduleId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateModule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.updateModule(
      req.params.courseId as string,
      req.params.moduleId as string,
      req.body as UpdateCourseModuleInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteModule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.deleteModule(
      req.params.courseId as string,
      req.params.moduleId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function restoreModule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.restoreModule(
      req.params.courseId as string,
      req.params.moduleId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function duplicateModule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.duplicateModule(
      req.params.courseId as string,
      req.params.moduleId as string,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveModule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.archiveModule(
      req.params.courseId as string,
      req.params.moduleId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listLessons(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.listLessons(
      req.params.courseId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.createLesson(
      req.params.courseId as string,
      req.body as CreateCourseLessonInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.getLesson(
      req.params.courseId as string,
      req.params.lessonId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.updateLesson(
      req.params.courseId as string,
      req.params.lessonId as string,
      req.body as UpdateCourseLessonInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.deleteLesson(
      req.params.courseId as string,
      req.params.lessonId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function restoreLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.restoreLesson(
      req.params.courseId as string,
      req.params.lessonId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function duplicateLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.duplicateLesson(
      req.params.courseId as string,
      req.params.lessonId as string,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.archiveLesson(
      req.params.courseId as string,
      req.params.lessonId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function moveLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.moveLesson(
      req.params.courseId as string,
      req.params.lessonId as string,
      req.body as MoveLessonInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listLessonVersions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.listLessonVersions(
      req.params.courseId as string,
      req.params.lessonId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listResources(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.listResources(
      req.params.courseId as string,
      req.params.lessonId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createResource(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.createResource(
      req.params.courseId as string,
      req.params.lessonId as string,
      req.body as CreateCourseResourceInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateResource(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.updateResource(
      req.params.courseId as string,
      req.params.lessonId as string,
      req.params.resourceId as string,
      req.body as UpdateCourseResourceInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteResource(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseBuilderService.deleteResource(
      req.params.courseId as string,
      req.params.lessonId as string,
      req.params.resourceId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
