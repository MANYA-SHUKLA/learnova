import type { NextFunction, Request, Response } from 'express';
import type {
  AcceptBlueprintInput,
  AcceptOutlineInput,
  AcceptQuizInput,
  GenerateBlueprintInput,
  GenerateOutlineInput,
  GenerateQuizInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import { contentGeneratorService } from '../../services/ai/content-generator.service.js';
import type { ActorContext } from '../../services/course-builder/course-builder.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

function courseIdFrom(req: Request): string {
  return String(req.params.courseId);
}

export async function generateOutline(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await contentGeneratorService.generateOutline(
      courseIdFrom(req),
      req.body as GenerateOutlineInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function acceptOutline(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await contentGeneratorService.acceptOutline(
      courseIdFrom(req),
      req.body as AcceptOutlineInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function generateQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await contentGeneratorService.generateQuiz(
      courseIdFrom(req),
      req.body as GenerateQuizInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function acceptQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await contentGeneratorService.acceptQuiz(
      courseIdFrom(req),
      req.body as AcceptQuizInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function generateBlueprint(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await contentGeneratorService.generateBlueprint(
      courseIdFrom(req),
      req.body as GenerateBlueprintInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function acceptBlueprint(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await contentGeneratorService.acceptBlueprint(
      courseIdFrom(req),
      req.body as AcceptBlueprintInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
