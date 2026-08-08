import type { NextFunction, Request, Response } from 'express';
import type {
  CreateEnrollmentInput,
  EnrollmentBulkEnrollInput,
  EnrollmentBulkIdsInput,
  EnrollmentBulkAssignFacultyInput,
  EnrollmentListQuery,
  EnrollmentSearchQuery,
  EnrollmentExportQuery,
  EnrollmentImportConfirmInput,
  UpdateEnrollmentInput,
  EnrollmentSelfEnrollInput,
  EnrollmentRejectInput,
  EnrollmentWithdrawInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import {
  enrollmentService,
  type ActorContext,
} from '../../services/enrollment/enrollment.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function listEnrollments(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await enrollmentService.list(
      req.query as unknown as EnrollmentListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function searchEnrollments(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as EnrollmentSearchQuery;
    const result = await enrollmentService.search(
      query.q ?? '',
      query.page,
      query.limit,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getEnrollmentStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.getStats(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.create(
      req.body as CreateEnrollmentInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.get(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.update(
      req.params.id as string,
      req.body as UpdateEnrollmentInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.archive(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function restoreEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.restore(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function approveEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.approve(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function rejectEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as EnrollmentRejectInput;
    const data = await enrollmentService.reject(
      req.params.id as string,
      body.reason ?? null,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function withdrawEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as EnrollmentWithdrawInput;
    const data = await enrollmentService.withdraw(
      req.params.id as string,
      body.reason ?? null,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function completeEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.complete(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function selfEnroll(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.selfEnroll(
      req.body as EnrollmentSelfEnrollInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function joinWaitlist(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = req.body as { courseId: string };
    const data = await enrollmentService.joinWaitlist(courseId, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function leaveWaitlist(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = req.body as { courseId: string };
    const data = await enrollmentService.leaveWaitlist(courseId, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getWaitlist(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = req.query as { courseId: string };
    const data = await enrollmentService.getWaitlist(courseId, actorFrom(req));
    sendSuccess(res, { items: data }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkEnroll(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.bulkEnroll(
      req.body as EnrollmentBulkEnrollInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkApprove(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.bulkApprove(
      req.body as EnrollmentBulkIdsInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkReject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.bulkReject(
      req.body as EnrollmentBulkIdsInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkDelete(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.bulkDelete(
      req.body as EnrollmentBulkIdsInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.bulkAssignFaculty(
      req.body as EnrollmentBulkAssignFacultyInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function previewEnrollmentImport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.previewImport(
      req.body as EnrollmentImportConfirmInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function importEnrollments(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.import(
      req.body as EnrollmentImportConfirmInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function exportEnrollments(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.export(
      req.query as unknown as EnrollmentExportQuery,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listEnrollmentAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const { enrollmentId } = req.query as { enrollmentId?: string };
    const data = await enrollmentService.listAudit(enrollmentId, actorFrom(req));
    sendSuccess(res, { items: data }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getOwnEnrollments(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await enrollmentService.getOwnEnrollments(actorFrom(req));
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
