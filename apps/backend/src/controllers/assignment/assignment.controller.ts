import type { NextFunction, Request, Response } from 'express';
import type {
  AssignmentFileUploadInput,
  AssignmentListQuery,
  CreateAssignmentInput,
  CreateCommentInput,
  CreateRubricInput,
  GradeSubmissionInput,
  SaveSubmissionDraftInput,
  SubmissionListQuery,
  SubmitAssignmentInput,
  UpdateAssignmentInput,
  UpdateRubricInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendPaginated, sendSuccess } from '../../utils/response/index.js';
import {
  assignmentService,
  type ActorContext,
  type AssignmentExportQuery,
  type AssignmentImportConfirmInput,
} from '../../services/assignment/assignment.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

// ------------------------------------------------------------------ assignments

export async function listAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await assignmentService.list(
      req.query as unknown as AssignmentListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function searchAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await assignmentService.search(
      req.query,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getAssignmentStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.getStats(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.get(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.create(
      req.body as CreateAssignmentInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.update(
      req.params.id as string,
      req.body as UpdateAssignmentInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.remove(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function publishAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.publish(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.archive(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function closeAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.close(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function uploadAssignmentAttachment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await assignmentService.uploadAssignmentAttachment(
      req.params.id as string,
      req.body as AssignmentFileUploadInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getOwnAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await assignmentService.getOwnAssignments(
      req.query as unknown as AssignmentListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------ rubrics

export async function listRubrics(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as { page?: number; limit?: number; q?: string };
    const result = await assignmentService.listRubrics(query, actorFrom(req));
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getRubric(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.getRubric(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createRubric(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.createRubric(
      req.body as CreateRubricInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateRubric(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.updateRubric(
      req.params.id as string,
      req.body as UpdateRubricInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteRubric(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.deleteRubric(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------ submissions

export async function listSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await assignmentService.listSubmissions(
      req.query as unknown as SubmissionListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.getSubmission(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function saveSubmissionDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.saveDraft(
      req.body as SaveSubmissionDraftInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function submitAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.submit(
      req.body as SubmitAssignmentInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function gradeSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.gradeSubmission(
      req.params.id as string,
      req.body as GradeSubmissionInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function uploadSubmissionFile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.uploadSubmissionFile(
      req.params.id as string,
      req.body as AssignmentFileUploadInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------ comments

export async function listComments(req: Request, res: Response, next: NextFunction) {
  try {
    const { submissionId } = req.query as { submissionId?: string };
    const data = await assignmentService.listComments(
      req.params.id as string,
      submissionId,
      actorFrom(req),
    );
    sendSuccess(res, { items: data }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CreateCommentInput;
    const data = await assignmentService.addComment(
      { ...body, assignmentId: req.params.id as string },
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------ dashboards

export async function facultyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.getFacultyDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function studentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.getStudentDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function institutionDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.getInstitutionDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------ import/export

export async function importAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.import(
      req.body as AssignmentImportConfirmInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function exportAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await assignmentService.export(
      req.query as unknown as AssignmentExportQuery,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listAssignmentAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const { assignmentId } = req.query as { assignmentId?: string };
    const data = await assignmentService.listAudit(assignmentId, actorFrom(req));
    sendSuccess(res, { items: data }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
