import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import type { JwtPayload, Permission } from '@learnova/types';
import {
  authenticate,
  optionalAuthenticate,
  requireOwnership,
  requirePermission,
  requireRole,
} from '../../middlewares/auth.middleware.js';
import { ForbiddenError, UnauthorizedError } from '../../utils/errors/index.js';

const mockFindById = vi.fn();
const mockFindSession = vi.fn();
const mockTouch = vi.fn();
const mockVerifyAccessToken = vi.fn();

vi.mock('../../repositories/auth/user.repository.js', () => ({
  userRepository: { findById: (...args: unknown[]) => mockFindById(...args) },
}));

vi.mock('../../repositories/auth/session.repository.js', () => ({
  sessionRepository: {
    findById: (...args: unknown[]) => mockFindSession(...args),
    touch: (...args: unknown[]) => mockTouch(...args),
  },
}));

vi.mock('../../utils/jwt/index.js', () => ({
  verifyAccessToken: (...args: unknown[]) => mockVerifyAccessToken(...args),
}));

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    params: {},
    ...overrides,
  } as Request;
}

function mockRes(): Response {
  return {} as Response;
}

function runMiddleware(
  handler: (req: Request, res: Response, next: NextFunction) => void,
  req: Request,
): Promise<{ err?: unknown; req: Request }> {
  return new Promise((resolve) => {
    const next = (err?: unknown) => resolve({ err, req });
    handler(req, mockRes(), next);
  });
}

const basePayload: JwtPayload = {
  sub: 'user-1',
  email: 'test@learnova.test',
  role: 'faculty',
  institutionId: 'inst-1',
  permissions: ['course:read'] as Permission[],
  sessionId: 'session-1',
  tv: 1,
  iat: 1,
  exp: 9999999999,
};

describe('auth.middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindById.mockResolvedValue({ isActive: true, tokenVersion: 1 });
    mockFindSession.mockResolvedValue({ revokedAt: null, expiresAt: new Date(Date.now() + 60_000) });
    mockVerifyAccessToken.mockReturnValue(basePayload);
  });

  it('rejects missing bearer token when required', async () => {
    const { err } = await runMiddleware(authenticate({ required: true }), mockReq());
    expect(err).toBeInstanceOf(UnauthorizedError);
  });

  it('allows missing bearer token when optional', async () => {
    const req = mockReq();
    const { err } = await runMiddleware(optionalAuthenticate(), req);
    expect(err).toBeUndefined();
    expect(req.user).toBeUndefined();
  });

  it('attaches user for valid bearer token', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
    const { err } = await runMiddleware(authenticate({ required: true }), req);
    expect(err).toBeUndefined();
    expect(req.user?.sub).toBe('user-1');
    expect(mockTouch).toHaveBeenCalledWith('session-1');
  });

  it('rejects revoked session', async () => {
    mockFindSession.mockResolvedValue({ revokedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) });
    const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
    const { err } = await runMiddleware(authenticate({ required: true }), req);
    expect(err).toBeInstanceOf(UnauthorizedError);
  });

  it('requirePermission passes when permission present', async () => {
    const req = mockReq({ user: basePayload });
    const { err } = await runMiddleware(requirePermission('course:read'), req);
    expect(err).toBeUndefined();
  });

  it('requirePermission rejects missing permission', async () => {
    const req = mockReq({ user: basePayload });
    const { err } = await runMiddleware(requirePermission('student:manage'), req);
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('requireRole rejects wrong role', async () => {
    const req = mockReq({ user: basePayload });
    const { err } = await runMiddleware(requireRole('institution_admin'), req);
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('requireOwnership allows self or admin', async () => {
    const selfReq = mockReq({ user: basePayload, params: { userId: 'user-1' } });
    const self = await runMiddleware(requireOwnership('userId'), selfReq);
    expect(self.err).toBeUndefined();

    const adminReq = mockReq({
      user: { ...basePayload, role: 'institution_admin' },
      params: { userId: 'other-user' },
    });
    const admin = await runMiddleware(requireOwnership('userId'), adminReq);
    expect(admin.err).toBeUndefined();
  });

  it('requireOwnership rejects other users for faculty', async () => {
    const req = mockReq({ user: basePayload, params: { userId: 'other-user' } });
    const { err } = await runMiddleware(requireOwnership('userId'), req);
    expect(err).toBeInstanceOf(ForbiddenError);
  });
});
