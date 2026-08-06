import { Types } from 'mongoose';
import { AUTH } from '@learnova/constants';
import type { AuthUser, AuthTokens, Permission, Role, Session } from '@learnova/types';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInstitutionInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '@learnova/validation';
import { getPermissionsForRole } from '@learnova/shared';
import {
  AuthenticationError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import {
  generateRandomToken,
  generateUuid,
  hashPassword,
  sha256Hash,
  verifyPassword,
} from '../../security/index.js';
import {
  accessTokenExpiresInSeconds,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt/index.js';
import { sendMail } from '../../mail/index.js';
import { mailHtml, mailText } from '../../mail/mail-copy.js';
import { env } from '../../config/env.js';
import {
  auditAuthLogRepository,
  emailVerificationTokenRepository,
  loginAttemptRepository,
  passwordResetTokenRepository,
  refreshTokenRepository,
  roleRepository,
  sessionRepository,
  userRepository,
} from '../../repositories/auth/index.js';
import type { UserEntity } from '../../repositories/auth/user.repository.js';
import { computeLockUntil, parseUserAgent, type ClientContext } from './auth.utils.js';

function frontendBaseUrl(): string {
  return (env.CORS_ORIGINS ?? 'http://localhost:3000').split(',')[0]?.trim() ?? 'http://localhost:3000';
}

function toAuthUser(user: UserEntity, role: Role, permissions: Permission[]): AuthUser {
  return {
    id: String(user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: role as AuthUser['role'],
    institutionId: String(user.institutionId),
    permissions,
    locale: user.locale as AuthUser['locale'],
    avatarUrl: user.avatarUrl ?? null,
    isEmailVerified: user.isEmailVerified,
  };
}

function toSessionDto(
  session: {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    deviceType: Session['deviceType'];
    expiresAt: Date;
    createdAt?: Date;
    lastActivityAt?: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
    browser?: string | null;
    os?: string | null;
    country?: string | null;
  },
  isCurrent = false,
): Session {
  return {
    id: String(session._id),
    userId: String(session.userId),
    deviceType: session.deviceType,
    expiresAt: session.expiresAt.toISOString(),
    createdAt: (session.createdAt ?? new Date()).toISOString(),
    lastActivityAt: (session.lastActivityAt ?? new Date()).toISOString(),
    userAgent: session.userAgent ?? null,
    ipAddress: session.ipAddress ?? null,
    browser: session.browser ?? null,
    os: session.os ?? null,
    country: session.country ?? null,
    isCurrent,
  };
}

async function resolveRolePermissions(roleId: Types.ObjectId): Promise<{
  role: Role;
  permissions: Permission[];
}> {
  const roleDoc = await roleRepository.findById(String(roleId));
  if (!roleDoc) {
    throw new AuthenticationError('Role not found for user');
  }
  const role = roleDoc.name;
  const permissions = [...getPermissionsForRole(role)];
  return { role, permissions };
}

async function issueSessionTokens(
  user: UserEntity,
  role: Role,
  permissions: Permission[],
  ctx: ClientContext,
  familyId?: string,
  version = 0,
): Promise<{ tokens: AuthTokens; session: Session; refreshTokenRaw: string }> {
  const ua = parseUserAgent(ctx.userAgent);
  const expiresAt = new Date(Date.now() + AUTH.REFRESH_TTL_MS);

  const session = await sessionRepository.create({
    userId: user._id,
    deviceType: ua.deviceType,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    browser: ua.browser,
    os: ua.os,
    country: null,
    expiresAt,
  });

  const family = familyId ?? generateUuid();
  const refreshPayload = {
    sub: String(user._id),
    sessionId: String(session._id),
    familyId: family,
    version,
  };

  const refreshTokenRaw = signRefreshToken(refreshPayload);
  const tokenHash = sha256Hash(refreshTokenRaw);

  await refreshTokenRepository.create({
    userId: user._id,
    tokenHash,
    familyId: family,
    version,
    sessionId: session._id,
    expiresAt,
    userAgent: ctx.userAgent,
    ipAddress: ctx.ipAddress,
  });

  const accessToken = signAccessToken({
    sub: String(user._id),
    email: user.email,
    role,
    institutionId: String(user.institutionId),
    permissions,
    sessionId: String(session._id),
    tv: user.tokenVersion,
  });

  await auditAuthLogRepository.create({
    event: 'session.created',
    userId: user._id,
    email: user.email,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    correlationId: ctx.correlationId,
    metadata: { sessionId: String(session._id), familyId: family },
  });

  return {
    tokens: {
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn: accessTokenExpiresInSeconds(),
    },
    session: toSessionDto(session, true),
    refreshTokenRaw,
  };
}

async function assertPasswordNotReused(
  plain: string,
  history: string[],
  currentHash?: string,
): Promise<void> {
  const candidates = currentHash ? [currentHash, ...history] : history;
  for (const hash of candidates.slice(0, AUTH.PASSWORD_HISTORY_SIZE)) {
    if (await verifyPassword(plain, hash)) {
      throw new ValidationError('Password was used recently. Choose a different password.');
    }
  }
}

async function sendVerificationEmail(
  user: UserEntity,
  ctx: ClientContext,
): Promise<void> {
  await emailVerificationTokenRepository.invalidateForUser(String(user._id));
  const raw = generateRandomToken(32);
  await emailVerificationTokenRepository.create({
    userId: user._id,
    tokenHash: sha256Hash(raw),
    expiresAt: new Date(Date.now() + AUTH.VERIFICATION_TOKEN_TTL_MS),
  });

  const link = `${frontendBaseUrl()}/en/verify-email?token=${raw}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your Learnova email',
    html: mailHtml(
      `<p>Hello ${user.firstName},</p><p>Verify your email: <a href="${link}">${link}</a></p>`,
    ),
    text: mailText(`Hello ${user.firstName},\n\nVerify your email: ${link}`),
  });

  await auditAuthLogRepository.create({
    event: 'email.verification_sent',
    userId: user._id,
    email: user.email,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    correlationId: ctx.correlationId,
  });
}

export class AuthService {
  async registerInstitution(input: RegisterInstitutionInput, ctx: ClientContext) {
    if (!env.SAAS_MODE) {
      throw new ForbiddenError(
        'Institution self-registration is disabled. Contact your Learnova operator.',
      );
    }

    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const role = await roleRepository.findByName('institution_admin');
    if (!role) {
      throw new NotFoundError('Institution admin role is not seeded');
    }

    const passwordHash = await hashPassword(input.password);
    const institutionId = new Types.ObjectId();

    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roleId: role._id,
      institutionId,
      isEmailVerified: false,
      passwordHistory: [],
      lastPasswordChangedAt: new Date(),
    });

    await auditAuthLogRepository.create({
      event: 'user.registered',
      userId: user._id,
      email: user.email,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
      metadata: { institutionName: input.institutionName, institutionId: String(institutionId) },
    });

    await sendVerificationEmail(user, ctx);

    await sendMail({
      to: user.email,
      subject: 'Welcome to Learnova',
      html: mailHtml(
        `<p>Welcome ${user.firstName}!</p><p>Your institution <strong>${input.institutionName}</strong> is ready. Please verify your email to sign in.</p>`,
      ),
      text: mailText(
        `Welcome ${user.firstName}! Your institution ${input.institutionName} is ready. Verify your email to sign in.`,
      ),
    });

    const permissions = [...getPermissionsForRole('institution_admin')] as Permission[];
    return {
      user: toAuthUser(user, 'institution_admin', permissions),
      message: 'Registration successful. Please verify your email before signing in.',
    };
  }

  async login(input: LoginInput, ctx: ClientContext) {
    const user = await userRepository.findByEmail(input.email);

    const fail = async (
      reason: string,
      status: 'auth' | 'forbidden' = 'auth',
    ): Promise<never> => {
      await loginAttemptRepository.create({
        email: input.email,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        success: false,
        reason,
        userId: user?._id ?? null,
      });
      await auditAuthLogRepository.create({
        event: 'user.login_failed',
        userId: user?._id ?? null,
        email: input.email,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        correlationId: ctx.correlationId,
        metadata: { reason },
      });
      if (status === 'forbidden') {
        throw new ForbiddenError(reason);
      }
      throw new AuthenticationError('Invalid email or password');
    };

    if (!user) {
      return fail('user_not_found');
    }

    const activeUser = user;

    if (activeUser.lockedUntil && activeUser.lockedUntil > new Date()) {
      return fail('Account is temporarily locked. Try again later.', 'forbidden');
    }

    if (!activeUser.isActive) {
      return fail('Account is deactivated.', 'forbidden');
    }

    if (!activeUser.isEmailVerified) {
      return fail('Email is not verified. Please verify your email.', 'forbidden');
    }

    const valid = await verifyPassword(input.password, activeUser.passwordHash);
    if (!valid) {
      const updated = await userRepository.incrementFailedAttempts(String(activeUser._id));
      const attempts = updated?.failedLoginAttempts ?? activeUser.failedLoginAttempts + 1;
      const lockedUntil = computeLockUntil(attempts);
      if (lockedUntil) {
        await userRepository.updateById(String(activeUser._id), { lockedUntil });
      }
      return fail('invalid_password');
    }

    await userRepository.resetFailedAttempts(String(activeUser._id));
    await userRepository.updateById(String(activeUser._id), { lastLoginAt: new Date() });

    const { role, permissions } = await resolveRolePermissions(activeUser.roleId);
    const issued = await issueSessionTokens(activeUser, role, permissions, ctx);

    await loginAttemptRepository.create({
      email: input.email,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      success: true,
      userId: activeUser._id,
    });

    await auditAuthLogRepository.create({
      event: 'user.login',
      userId: activeUser._id,
      email: activeUser.email,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
      metadata: { sessionId: issued.session.id },
    });

    return {
      user: toAuthUser(activeUser, role, permissions),
      session: issued.session,
      tokens: issued.tokens,
    };
  }

  async refresh(refreshTokenRaw: string | undefined, ctx: ClientContext) {
    if (!refreshTokenRaw) {
      throw new AuthenticationError('Refresh token missing');
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshTokenRaw);
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const tokenHash = sha256Hash(refreshTokenRaw);
    const stored = await refreshTokenRepository.findByHash(tokenHash);

    if (!stored || stored.revokedAt) {
      if (payload.familyId) {
        await refreshTokenRepository.revokeFamily(payload.familyId);
      }
      throw new AuthenticationError('Refresh token revoked');
    }

    if (stored.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token expired');
    }

    if (
      stored.familyId !== payload.familyId ||
      stored.version !== payload.version ||
      String(stored.sessionId) !== payload.sessionId
    ) {
      await refreshTokenRepository.revokeFamily(payload.familyId);
      throw new AuthenticationError('Refresh token reuse detected');
    }

    const session = await sessionRepository.findById(payload.sessionId);
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      await refreshTokenRepository.revokeFamily(payload.familyId);
      throw new AuthenticationError('Session revoked');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user?.isActive) {
      throw new AuthenticationError('User inactive');
    }

    const { role, permissions } = await resolveRolePermissions(user.roleId);

    // Rotate: revoke old, issue new in same family with version+1
    const newVersion = stored.version + 1;
    const expiresAt = new Date(Date.now() + AUTH.REFRESH_TTL_MS);
    const newRaw = signRefreshToken({
      sub: String(user._id),
      sessionId: String(session._id),
      familyId: stored.familyId,
      version: newVersion,
    });
    const newHash = sha256Hash(newRaw);
    const created = await refreshTokenRepository.create({
      userId: user._id,
      tokenHash: newHash,
      familyId: stored.familyId,
      version: newVersion,
      sessionId: session._id,
      expiresAt,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
    });
    await refreshTokenRepository.revoke(stored._id, created._id);
    await sessionRepository.touch(String(session._id));

    const accessToken = signAccessToken({
      sub: String(user._id),
      email: user.email,
      role,
      institutionId: String(user.institutionId),
      permissions,
      sessionId: String(session._id),
      tv: user.tokenVersion,
    });

    return {
      user: toAuthUser(user, role, permissions),
      session: toSessionDto(session, true),
      tokens: {
        accessToken,
        refreshToken: newRaw,
        expiresIn: accessTokenExpiresInSeconds(),
      } satisfies AuthTokens,
    };
  }

  async logout(userId: string, sessionId: string | undefined, ctx: ClientContext) {
    if (sessionId) {
      await sessionRepository.revoke(sessionId);
      await refreshTokenRepository.revokeBySession(sessionId);
      await auditAuthLogRepository.create({
        event: 'session.revoked',
        userId: new Types.ObjectId(userId),
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        correlationId: ctx.correlationId,
        metadata: { sessionId },
      });
    }
    await auditAuthLogRepository.create({
      event: 'user.logout',
      userId: new Types.ObjectId(userId),
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
      metadata: { sessionId },
    });
  }

  async logoutAll(userId: string, ctx: ClientContext) {
    await sessionRepository.revokeAllForUser(userId);
    await refreshTokenRepository.revokeAllForUser(userId);
    await userRepository.bumpTokenVersion(userId);
    await auditAuthLogRepository.create({
      event: 'user.logout_all',
      userId: new Types.ObjectId(userId),
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
    });
  }

  async forgotPassword(input: ForgotPasswordInput, ctx: ClientContext) {
    const user = await userRepository.findByEmail(input.email);
    // Always succeed to avoid account enumeration
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    await passwordResetTokenRepository.invalidateForUser(String(user._id));
    const raw = generateRandomToken(32);
    await passwordResetTokenRepository.create({
      userId: user._id,
      tokenHash: sha256Hash(raw),
      expiresAt: new Date(Date.now() + AUTH.RESET_TOKEN_TTL_MS),
    });

    const link = `${frontendBaseUrl()}/en/reset-password?token=${raw}`;
    await sendMail({
      to: user.email,
      subject: 'Reset your Learnova password',
      html: mailHtml(
        `<p>Reset your password: <a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`,
      ),
      text: mailText(`Reset your password: ${link}\nThis link expires in 1 hour.`),
    });

    await auditAuthLogRepository.create({
      event: 'password.reset_requested',
      userId: user._id,
      email: user.email,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
    });

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(input: ResetPasswordInput, ctx: ClientContext) {
    const token = await passwordResetTokenRepository.findValidByHash(sha256Hash(input.token));
    if (!token) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    const user = await userRepository.findById(String(token.userId));
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await assertPasswordNotReused(input.password, [...user.passwordHistory], user.passwordHash);

    const passwordHash = await hashPassword(input.password);
    const history = [user.passwordHash, ...user.passwordHistory].slice(
      0,
      AUTH.PASSWORD_HISTORY_SIZE,
    );

    await userRepository.updateById(String(user._id), {
      passwordHash,
      passwordHistory: history,
      lastPasswordChangedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    await passwordResetTokenRepository.markUsed(token._id);
    await sessionRepository.revokeAllForUser(String(user._id));
    await refreshTokenRepository.revokeAllForUser(String(user._id));
    await userRepository.bumpTokenVersion(String(user._id));

    await auditAuthLogRepository.create({
      event: 'password.reset_completed',
      userId: user._id,
      email: user.email,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
    });

    return { message: 'Password has been reset. Please sign in.' };
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
    ctx: ClientContext,
  ) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const ok = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!ok) {
      throw new AuthenticationError('Current password is incorrect');
    }

    await assertPasswordNotReused(input.newPassword, [...user.passwordHistory], user.passwordHash);

    const passwordHash = await hashPassword(input.newPassword);
    const history = [user.passwordHash, ...user.passwordHistory].slice(
      0,
      AUTH.PASSWORD_HISTORY_SIZE,
    );

    await userRepository.updateById(userId, {
      passwordHash,
      passwordHistory: history,
      lastPasswordChangedAt: new Date(),
    });
    await sessionRepository.revokeAllForUser(userId);
    await refreshTokenRepository.revokeAllForUser(userId);
    await userRepository.bumpTokenVersion(userId);

    await auditAuthLogRepository.create({
      event: 'password.changed',
      userId: user._id,
      email: user.email,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
    });

    return { message: 'Password changed. Please sign in again.' };
  }

  async verifyEmail(input: VerifyEmailInput, ctx: ClientContext) {
    const token = await emailVerificationTokenRepository.findValidByHash(
      sha256Hash(input.token),
    );
    if (!token) {
      throw new AuthenticationError('Invalid or expired verification token');
    }

    const user = await userRepository.findById(String(token.userId));
    if (!user) throw new NotFoundError('User not found');

    await userRepository.updateById(String(user._id), { isEmailVerified: true });
    await emailVerificationTokenRepository.markUsed(token._id);

    await auditAuthLogRepository.create({
      event: 'email.verified',
      userId: user._id,
      email: user.email,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
    });

    return { message: 'Email verified successfully. You can sign in.' };
  }

  async resendVerification(input: ResendVerificationInput, ctx: ClientContext) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || user.isEmailVerified) {
      return { message: 'If that account needs verification, an email has been sent.' };
    }
    await sendVerificationEmail(user, ctx);
    return { message: 'If that account needs verification, an email has been sent.' };
  }

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    const { role, permissions } = await resolveRolePermissions(user.roleId);
    return toAuthUser(user, role, permissions);
  }

  async getCurrentSession(userId: string, sessionId: string) {
    const session = await sessionRepository.findById(sessionId);
    if (!session || String(session.userId) !== userId) {
      throw new NotFoundError('Session not found');
    }
    if (session.revokedAt) {
      throw new AuthenticationError('Session revoked');
    }
    return toSessionDto(session, true);
  }

  async listSessions(userId: string, currentSessionId?: string) {
    const sessions = await sessionRepository.findActiveByUser(userId);
    return sessions.map((s) => toSessionDto(s, String(s._id) === currentSessionId));
  }

  async revokeSession(userId: string, sessionId: string, ctx: ClientContext) {
    const session = await sessionRepository.findById(sessionId);
    if (!session || String(session.userId) !== userId) {
      throw new NotFoundError('Session not found');
    }
    await sessionRepository.revoke(sessionId);
    await refreshTokenRepository.revokeBySession(sessionId);
    await auditAuthLogRepository.create({
      event: 'session.revoked',
      userId: new Types.ObjectId(userId),
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
      metadata: { sessionId },
    });
    return { message: 'Session revoked' };
  }
}

export const authService = new AuthService();
