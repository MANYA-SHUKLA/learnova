import type { NextFunction, Request, Response } from 'express';
import type {
  CreateCourseInput,
  CourseBulkAssignFacultyInput,
  CourseBulkAssignProgramInput,
  CourseBulkAssignSemesterInput,
  CourseBulkIdsInput,
  CourseBulkStatusInput,
  CourseExportQuery,
  CourseImportConfirmInput,
  CourseListQuery,
  CourseSearchQuery,
  CourseThumbnailUploadInput,
  UpdateCourseInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import { courseService, type ActorContext } from '../../services/course/course.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function listCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await courseService.list(
      req.query as unknown as CourseListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function searchCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as CourseSearchQuery;
    const result = await courseService.search(query.q, query.page, query.limit, actorFrom(req));
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getCourseStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.getStats(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.create(req.body as CreateCourseInput, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.get(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.update(
      req.params.id as string,
      req.body as UpdateCourseInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.archive(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function restoreCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.restore(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function publishCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.publish(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function unpublishCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.unpublish(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveStatusCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.archiveStatus(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function duplicateCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.duplicate(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listCourseAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
    const data = await courseService.listAudit(courseId, actorFrom(req));
    sendSuccess(res, { items: data }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkPublishCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.bulkPublish(req.body as CourseBulkIdsInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkUnpublishCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.bulkUnpublish(req.body as CourseBulkIdsInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkArchiveCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.bulkArchive(req.body as CourseBulkIdsInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkDeleteCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.bulkDelete(req.body as CourseBulkIdsInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkStatusCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.bulkStatus(
      req.body as CourseBulkStatusInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.bulkAssignFaculty(
      req.body as CourseBulkAssignFacultyInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.bulkAssignProgram(
      req.body as CourseBulkAssignProgramInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignSemester(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.bulkAssignSemester(
      req.body as CourseBulkAssignSemesterInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function previewCourseImport(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CourseImportConfirmInput;
    const data = courseService.previewImport(body.rows);
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function importCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.importCourses(
      req.body as CourseImportConfirmInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function exportCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await courseService.exportCourses(
      req.query as unknown as CourseExportQuery,
      actorFrom(req),
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.status(200).send(result.body);
  } catch (err) {
    next(err);
  }
}

export async function uploadCourseThumbnail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.uploadThumbnail(
      req.params.id as string,
      req.body as CourseThumbnailUploadInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function removeCourseThumbnail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.removeThumbnail(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
