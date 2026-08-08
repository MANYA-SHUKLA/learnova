import type { NextFunction, Request, Response } from 'express';
import type {
  AssignSeatingInput,
  CheckInExamInput,
  CreateExamInput,
  ExamBulkActionInput,
  ExamListQuery,
  ProctorEventInput,
  StartExamAttemptInput,
  SubmitExamAnswerInput,
  SubmitExamInput,
  UpdateExamInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendPaginated, sendSuccess } from '../../utils/response/index.js';
import { examinationService, type ActorContext } from '../../services/examination/examination.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function listExams(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await examinationService.list(
      req.query as unknown as ExamListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.get(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.create(req.body as CreateExamInput, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.update(
      req.params.id as string,
      req.body as UpdateExamInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.remove(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function publishExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.publish(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function scheduleExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.schedule(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function cancelExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.cancel(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.archive(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function duplicateExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.duplicate(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkExamAction(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.bulkAction(
      req.body as ExamBulkActionInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function assignSeating(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.assignSeating(
      req.body as AssignSeatingInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listSeating(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listSeating(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function checkInExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.checkIn(req.body as CheckInExamInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function startAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.startAttempt(
      req.body as StartExamAttemptInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function saveAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.saveAnswer(
      req.params.id as string,
      req.body as SubmitExamAnswerInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function submitExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.submitExam(req.body as SubmitExamInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.getAttempt(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listAttempts(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listAttempts(req.query, actorFrom(req));
    sendPaginated(res, data.items, data.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function startProctorSession(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.startProctorSession(
      req.params.id as string,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function logProctorEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.logProctorEvent(
      req.body as ProctorEventInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function flagAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as { message?: string | null };
    const data = await examinationService.flagAttempt(
      req.params.id as string,
      body.message ?? null,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function clearAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as { message?: string | null };
    const data = await examinationService.clearAttempt(
      req.params.id as string,
      body.message ?? null,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function terminateAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as { reason?: string };
    const data = await examinationService.terminateAttempt(
      req.params.id as string,
      body.reason ?? 'Terminated by proctor',
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getExamAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.getAnalytics(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listExamAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listAudit(
      actorFrom(req),
      req.query.examId as string | undefined,
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function facultyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.getFacultyDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function studentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.getStudentDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function institutionDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.getInstitutionDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getLiveMonitoring(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.getLiveMonitoring(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listViolations(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listViolations(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listAttendance(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listPolicies(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listPolicies(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createPolicy(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.createPolicy(req.body, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function reportStudentViolation(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.reportStudentViolation(
      req.params.id as string,
      req.body,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createBlueprint(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.createBlueprint(req.body, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listBlueprints(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listBlueprints(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function applyBlueprint(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.applyBlueprint(req.body, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.createTemplate(req.body, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listTemplates(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createExamFromTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.createExamFromTemplate(req.body, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function assignInvigilators(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.assignInvigilators(req.body, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listInvigilators(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listInvigilators(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getIncidentTimeline(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = typeof req.query.attemptId === 'string' ? req.query.attemptId : undefined;
    const data = await examinationService.getIncidentTimeline(
      req.params.id as string,
      actorFrom(req),
      attemptId,
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function upsertAccessibility(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.upsertAccessibility(req.body, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listAccessibility(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listAccessibility(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function resumeAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.resumeAttempt(req.body, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function heartbeatAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.heartbeatAttempt(req.body, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listExamVersions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listExamVersions(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listExamRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listExamRooms(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createExamRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.createExamRoom(req.body, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listExamAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.listExamAnnouncements(
      req.params.id as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function broadcastExamAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await examinationService.broadcastExamAnnouncement(req.body, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
