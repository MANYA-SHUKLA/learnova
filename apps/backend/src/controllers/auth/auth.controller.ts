import type { NextFunction, Request, Response } from 'express';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInstitutionInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '@learnova/validation';
import { signRoleHint } from '../../services/auth/role-hint.js';
import { authService } from '../../services/auth/auth.service.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import {
  clearRefreshCookie,
  getClientContext,
  readRefreshToken,
  setRefreshCookie,
} from '../../services/auth/cookie.utils.js';
import { UnauthorizedError } from '../../utils/errors/index.js';

function authSessionPayload(result: {
  user: { role: string };
  session: unknown;
  tokens: { accessToken: string; expiresIn: number };
}) {
  return {
    user: result.user,
    session: result.session,
    accessToken: result.tokens.accessToken,
    expiresIn: result.tokens.expiresIn,
    roleHint: signRoleHint(result.user.role),
  };
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as RegisterInstitutionInput;
    const result = await authService.registerInstitution(body, getClientContext(req));
    setRefreshCookie(res, result.tokens.refreshToken);
    sendCreated(
      res,
      authSessionPayload(result),
      { requestId: req.requestId },
    );
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as LoginInput;
    const result = await authService.login(body, getClientContext(req));
    setRefreshCookie(res, result.tokens.refreshToken);
    sendSuccess(
      res,
      authSessionPayload(result),
      { requestId: req.requestId },
    );
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    await authService.logout(req.user.sub, req.user.sessionId, getClientContext(req));
    clearRefreshCookie(res);
    sendSuccess(res, { message: 'Logged out' }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    await authService.logoutAll(req.user.sub, getClientContext(req));
    clearRefreshCookie(res);
    sendSuccess(res, { message: 'Logged out from all devices' }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = readRefreshToken(req);
    const result = await authService.refresh(token, getClientContext(req));
    setRefreshCookie(res, result.tokens.refreshToken);
    sendSuccess(
      res,
      authSessionPayload(result),
      { requestId: req.requestId },
    );
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as ForgotPasswordInput;
    const result = await authService.forgotPassword(body, getClientContext(req));
    sendSuccess(res, result, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as ResetPasswordInput;
    const result = await authService.resetPassword(body, getClientContext(req));
    clearRefreshCookie(res);
    sendSuccess(res, result, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const body = req.body as ChangePasswordInput;
    const result = await authService.changePassword(
      req.user.sub,
      body,
      getClientContext(req),
    );
    setRefreshCookie(res, result.tokens.refreshToken);
    sendSuccess(
      res,
      {
        message: result.message,
        user: result.user,
        session: result.session,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      },
      { requestId: req.requestId },
    );
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as VerifyEmailInput;
    const result = await authService.verifyEmail(body, getClientContext(req));
    sendSuccess(res, result, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as ResendVerificationInput;
    const result = await authService.resendVerification(body, getClientContext(req));
    sendSuccess(res, result, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const user = await authService.me(req.user.sub);
    sendSuccess(res, { user }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function currentSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const session = await authService.getCurrentSession(req.user.sub, req.user.sessionId);
    sendSuccess(res, { session }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listSessions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const sessions = await authService.listSessions(req.user.sub, req.user.sessionId);
    sendSuccess(res, { sessions }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function revokeSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const result = await authService.revokeSession(
      req.user.sub,
      req.params.id as string,
      getClientContext(req),
    );
    if (req.user.sessionId === req.params.id) {
      clearRefreshCookie(res);
    }
    sendSuccess(res, result, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
