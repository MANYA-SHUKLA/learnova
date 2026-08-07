import type { NextFunction, Request, Response } from 'express';
import type {
  CreateLabProblemInput,
  CreatePracticeLabInput,
  CreateTestCaseInput,
  DuplicateLabInput,
  ImportProblemsInput,
  LeaderboardQuery,
  PracticeLabListQuery,
  ProblemListQuery,
  PracticeSubmissionListQuery,
  RunCodeInput,
  SubmitSolutionInput,
  UpdateLabProblemInput,
  UpdatePracticeLabInput,
  UpdateTestCaseInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendPaginated, sendSuccess } from '../../utils/response/index.js';
import { practiceLabService, type ActorContext } from '../../services/practice-lab/index.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function listPracticeLabs(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await practiceLabService.list(
      req.query as unknown as PracticeLabListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function searchPracticeLabs(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await practiceLabService.search(
      req.query as unknown as PracticeLabListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getPracticeLab(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.get(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createPracticeLab(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.create(
      req.body as CreatePracticeLabInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updatePracticeLab(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.update(
      req.params.id as string,
      req.body as UpdatePracticeLabInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deletePracticeLab(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.remove(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function publishPracticeLab(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.publish(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archivePracticeLab(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.archive(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function restorePracticeLab(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.restore(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function closePracticeLab(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.close(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function duplicatePracticeLab(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.duplicate(
      req.params.id as string,
      req.body as DuplicateLabInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function exportPracticeLabs(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.exportLabs(req.query, actorFrom(req));
    if (data.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="practice-labs.csv"');
      res.send(data.content);
      return;
    }
    sendSuccess(res, data.content, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listProblems(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await practiceLabService.listProblems(
      req.query as unknown as ProblemListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getProblem(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.getProblem(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createProblem(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.createProblem(
      req.body as CreateLabProblemInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateProblem(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.updateProblem(
      req.params.id as string,
      req.body as UpdateLabProblemInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteProblem(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.removeProblem(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function importProblems(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.importProblems(
      req.body as ImportProblemsInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listTestCases(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.listTestCases(
      req.params.problemId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createTestCase(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.createTestCase(
      req.body as CreateTestCaseInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateTestCase(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.updateTestCase(
      req.params.id as string,
      req.body as UpdateTestCaseInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteTestCase(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.removeTestCase(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function runCode(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.runCode(req.body as RunCodeInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function submitSolution(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.submitSolution(
      req.body as SubmitSolutionInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await practiceLabService.listSubmissions(
      req.query as unknown as PracticeSubmissionListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.getSubmission(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listExecutions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await practiceLabService.listExecutions(req.query, actorFrom(req));
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.getProgress(
      req.params.labId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await practiceLabService.leaderboard(
      req.query as unknown as LeaderboardQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listLanguages(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.listLanguages();
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function institutionDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.institutionDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function facultyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.facultyDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function studentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await practiceLabService.studentDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);
    const result = await practiceLabService.listAudit(actorFrom(req), page, limit);
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
