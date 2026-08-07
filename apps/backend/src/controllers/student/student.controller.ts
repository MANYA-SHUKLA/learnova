import type { NextFunction, Request, Response } from 'express';
import type {
  CreateStudentInput,
  StudentBulkAssignBatchInput,
  StudentBulkAssignDepartmentInput,
  StudentBulkAssignSectionInput,
  StudentBulkAssignSemesterInput,
  StudentBulkIdsInput,
  StudentBulkStatusInput,
  StudentExportQuery,
  StudentImportConfirmInput,
  StudentListQuery,
  StudentPhotoUploadInput,
  StudentSearchQuery,
  UpdateStudentInput,
  UpdateStudentProfileInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import {
  studentService,
  type ActorContext,
} from '../../services/student/student.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function listStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await studentService.list(
      req.query as unknown as StudentListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function searchStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as StudentSearchQuery;
    const result = await studentService.search(query.q, query.page, query.limit, actorFrom(req));
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getStudentStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.getStats(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.create(req.body as CreateStudentInput, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.get(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.update(
      req.params.id as string,
      req.body as UpdateStudentInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getOwnStudentProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.getOwnProfile(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateOwnStudentProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.updateOwnProfile(
      req.body as UpdateStudentProfileInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.archive(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function restoreStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.restore(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function activateStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.activate(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deactivateStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.deactivate(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listStudentAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = typeof req.query.studentId === 'string' ? req.query.studentId : undefined;
    const data = await studentService.listAudit(studentId, actorFrom(req));
    sendSuccess(res, { items: data }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkArchiveStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.bulkArchive(req.body as StudentBulkIdsInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkActivateStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.bulkActivate(
      req.body as StudentBulkIdsInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkSuspendStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.bulkSuspend(req.body as StudentBulkIdsInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkStatusStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.bulkStatus(
      req.body as StudentBulkStatusInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.bulkAssignDepartment(
      req.body as StudentBulkAssignDepartmentInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignSection(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.bulkAssignSection(
      req.body as StudentBulkAssignSectionInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignSemester(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.bulkAssignSemester(
      req.body as StudentBulkAssignSemesterInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.bulkAssignBatch(
      req.body as StudentBulkAssignBatchInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function previewStudentImport(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as StudentImportConfirmInput;
    const data = studentService.previewImport(body.rows);
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function importStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.importStudents(
      req.body as StudentImportConfirmInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function exportStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await studentService.exportStudents(
      req.query as unknown as StudentExportQuery,
      actorFrom(req),
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.status(200).send(result.body);
  } catch (err) {
    next(err);
  }
}

export async function uploadStudentPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.uploadPhoto(
      req.params.id as string,
      req.body as StudentPhotoUploadInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function removeStudentPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentService.removePhoto(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
