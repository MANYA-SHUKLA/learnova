import type { NextFunction, Request, Response } from 'express';
import type {
  CreateQuestionBankInput,
  CreateQuestionInput,
  CreateQuizInput,
  QuizBulkActionInput,
  QuizListQuery,
  StartAttemptInput,
  SubmitAnswerInput,
  SubmitQuizInput,
  UpdateQuestionBankInput,
  UpdateQuestionInput,
  UpdateQuizInput,
  questionListQuerySchema,
} from '@learnova/validation';
import type { z } from 'zod';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendPaginated, sendSuccess } from '../../utils/response/index.js';
import {
  quizService,
  type ActorContext,
  type QuizExportQuery,
  type QuizImportConfirmInput,
} from '../../services/quiz/quiz.service.js';

type QuestionListQuery = z.infer<typeof questionListQuerySchema>;

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

// ------------------------------------------------------------------ quizzes

export async function listQuizzes(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await quizService.list(req.query as unknown as QuizListQuery, actorFrom(req));
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function searchQuizzes(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await quizService.search(req.query, actorFrom(req));
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getQuizStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.getStats(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listQuizAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.listAudit(actorFrom(req), req.query.quizId as string | undefined);
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function facultyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.getFacultyDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function studentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.getStudentDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function institutionDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.getInstitutionDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function exportQuizzes(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.export(req.query as unknown as QuizExportQuery, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function previewImportQuizzes(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as { quizzes: CreateQuizInput[] };
    const data = await quizService.previewImport(body.quizzes, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function confirmImportQuizzes(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.confirmImport(
      req.body as QuizImportConfirmInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkQuizAction(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.bulkAction(req.body as QuizBulkActionInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.get(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.create(req.body as CreateQuizInput, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.update(
      req.params.id as string,
      req.body as UpdateQuizInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.remove(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function publishQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.publish(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.archive(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function closeQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.close(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function duplicateQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.duplicate(req.params.id as string, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getQuizAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.getAnalytics(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------ question banks

export async function listQuestionBanks(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await quizService.listQuestionBanks(
      req.query as { page?: number; limit?: number; q?: string; status?: string },
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getQuestionBank(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.getQuestionBank(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createQuestionBank(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.createQuestionBank(
      req.body as CreateQuestionBankInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateQuestionBank(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.updateQuestionBank(
      req.params.id as string,
      req.body as UpdateQuestionBankInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveQuestionBank(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.archiveQuestionBank(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function duplicateQuestionBank(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.duplicateQuestionBank(req.params.id as string, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------ questions

export async function listQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await quizService.listQuestions(
      req.query as unknown as QuestionListQuery,
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.getQuestion(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.createQuestion(req.body as CreateQuestionInput, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.updateQuestion(
      req.params.id as string,
      req.body as UpdateQuestionInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.removeQuestion(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function duplicateQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.duplicateQuestion(req.params.id as string, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------ categories / tags

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.listCategories(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.createCategory(req.body, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.updateCategory(
      req.params.id as string,
      req.body,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.removeCategory(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listTags(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.listTags(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createTag(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.createTag(req.body, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateTag(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.updateTag(req.params.id as string, req.body, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function deleteTag(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.removeTag(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------ attempts

export async function startAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.startAttempt(req.body as StartAttemptInput, actorFrom(req));
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function saveAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.saveAnswer(
      req.params.id as string,
      req.body as SubmitAnswerInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function submitQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.submitQuiz(req.body as SubmitQuizInput, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.getAttempt(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listAttempts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await quizService.listAttempts(
      req.query as { quizId?: string; studentId?: string; page?: number; limit?: number },
      actorFrom(req),
    );
    sendPaginated(res, result.items, result.meta, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
