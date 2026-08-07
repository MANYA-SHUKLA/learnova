import type { NextFunction, Request, Response } from 'express';
import type {
  CreateMilestoneInput,
  CreateProjectInput,
  CreateReviewInput,
  CreateTeamInput,
  GradeProjectSubmissionInput,
  JoinTeamInput,
  ProjectFileUploadInput,
  ProjectListQuery,
  ProjectSubmissionListQuery,
  ProjectTeamListQuery,
  SaveProjectSubmissionDraftInput,
  SubmitProjectInput,
  SubmitReviewInput,
  UpdateMilestoneInput,
  UpdateProjectInput,
  UpdateTeamInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendPaginated, sendSuccess } from '../../utils/response/index.js';
import {
  projectService,
  type ActorContext,
  type ProjectExportQuery,
  type ProjectImportConfirmInput,
} from '../../services/project/project.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

// --------------------------------------------------------------------- projects

export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await projectService.list(
      req.query as unknown as ProjectListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function searchProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await projectService.search(req.query, actorFrom(req));
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getProjectStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.getStats(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listProjectAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.listAudit(req.query.projectId as string | undefined, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function facultyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.getFacultyDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function studentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.getStudentDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function institutionDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.getInstitutionDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function exportProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.export(
      req.query as unknown as ProjectExportQuery,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getOwnProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await projectService.getOwnProjects(
      req.query as unknown as ProjectListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.get(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.create(req.body as CreateProjectInput, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.update(
      req.params.id as string,
      req.body as UpdateProjectInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.remove(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function publishProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.publish(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.archive(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function closeProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.close(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function duplicateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.duplicate(req.params.id as string, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function uploadProjectAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.uploadProjectAttachment(
      req.params.id as string,
      req.body as ProjectFileUploadInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function importProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.import(
      req.body as ProjectImportConfirmInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------- milestones

export async function listMilestones(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.listMilestones(
      req.query.projectId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createMilestone(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.createMilestone(
      req.body as CreateMilestoneInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateMilestone(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.updateMilestone(
      req.params.id as string,
      req.body as UpdateMilestoneInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteMilestone(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.deleteMilestone(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function completeMilestone(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.completeMilestone(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------------- teams

export async function listTeams(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await projectService.listTeams(
      req.query as unknown as ProjectTeamListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.createTeam(req.body as CreateTeamInput, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function joinTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.joinTeam(req.body as JoinTeamInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function leaveTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.leaveTeam(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function removeTeamMember(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.removeTeamMember(
      req.params.id as string,
      req.params.studentId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.updateTeam(
      req.params.id as string,
      req.body as UpdateTeamInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.getTeam(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------ submissions

export async function listSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await projectService.listSubmissions(
      req.query as unknown as ProjectSubmissionListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function saveSubmissionDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.saveDraft(
      req.body as SaveProjectSubmissionDraftInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function submitProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.submit(req.body as SubmitProjectInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.getSubmission(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function gradeSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.prepareGrade(
      req.params.id as string,
      req.body as GradeProjectSubmissionInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function uploadSubmissionFile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.uploadSubmissionFile(
      req.params.id as string,
      req.body as ProjectFileUploadInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------- reviews

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.createReview(req.body as CreateReviewInput, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function submitReview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.submitReview(
      req.params.id as string,
      req.body as SubmitReviewInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getReview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await projectService.getReview(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
