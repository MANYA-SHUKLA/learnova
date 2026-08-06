import type { NextFunction, Request, Response } from 'express';
import type {
  CreateFacultyInput,
  FacultyBulkAssignAcademicInput,
  FacultyBulkAssignDepartmentInput,
  FacultyBulkAssignProgramInput,
  FacultyBulkIdsInput,
  FacultyBulkStatusInput,
  FacultyExportQuery,
  FacultyImportConfirmInput,
  FacultyListQuery,
  FacultyPhotoUploadInput,
  FacultySearchQuery,
  UpdateFacultyInput,
  UpdateFacultyProfileInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import {
  facultyService,
  type ActorContext,
} from '../../services/faculty/faculty.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function listFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await facultyService.list(
      req.query as unknown as FacultyListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function searchFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as FacultySearchQuery;
    const result = await facultyService.search(query.q, query.page, query.limit, actorFrom(req));
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getFacultyStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.getStats(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.create(req.body as CreateFacultyInput, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.get(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.update(
      req.params.id as string,
      req.body as UpdateFacultyInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getOwnFacultyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.getOwnProfile(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateOwnFacultyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.updateOwnProfile(
      req.body as UpdateFacultyProfileInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.archive(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function restoreFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.restore(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function activateFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.activate(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deactivateFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.deactivate(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listFacultyAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const facultyId = typeof req.query.facultyId === 'string' ? req.query.facultyId : undefined;
    const data = await facultyService.listAudit(facultyId, actorFrom(req));
    sendSuccess(res, { items: data }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkArchiveFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.bulkArchive(req.body as FacultyBulkIdsInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkActivateFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.bulkActivate(req.body as FacultyBulkIdsInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkSuspendFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.bulkSuspend(req.body as FacultyBulkIdsInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkStatusFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.bulkStatus(
      req.body as FacultyBulkStatusInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.bulkAssignDepartment(
      req.body as FacultyBulkAssignDepartmentInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.bulkAssignProgram(
      req.body as FacultyBulkAssignProgramInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignAcademic(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.bulkAssignAcademic(
      req.body as FacultyBulkAssignAcademicInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function previewFacultyImport(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as FacultyImportConfirmInput;
    const data = facultyService.previewImport(body.rows);
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function importFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.importFaculty(
      req.body as FacultyImportConfirmInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function exportFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await facultyService.exportFaculty(
      req.query as unknown as FacultyExportQuery,
      actorFrom(req),
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.status(200).send(result.body);
  } catch (err) {
    next(err);
  }
}

export async function uploadFacultyPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.uploadPhoto(
      req.params.id as string,
      req.body as FacultyPhotoUploadInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function removeFacultyPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await facultyService.removePhoto(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
