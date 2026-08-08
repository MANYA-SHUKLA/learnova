import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../../utils/errors/index.js';

const mockLog = vi.fn();
const mockFacultyCanAccessCourse = vi.fn();
const mockResolveStudentSelf = vi.fn();

vi.mock('../../services/audit/access-denial.js', () => ({
  logAccessDenial: (...args: unknown[]) => mockLog(...args),
}));

vi.mock('../../services/access/faculty-scope.js', () => ({
  facultyCanAccessCourse: (...args: unknown[]) => mockFacultyCanAccessCourse(...args),
  facultyCanAccessStudent: vi.fn(),
  resolveStudentSelfObjectId: (...args: unknown[]) => mockResolveStudentSelf(...args),
}));

import { facultyCourseGuard, studentOwnershipGuard, tenantGuard } from '../../middlewares/scope.middleware.js';

function run(handler: (req: Request, res: Response, next: NextFunction) => void, req: Request) {
  return new Promise<{ err?: unknown }>((resolve) => {
    handler(req, {} as Response, (err?: unknown) => resolve({ err }));
  });
}

describe('scope.middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tenantGuard requires institutionId on JWT', async () => {
    const { err } = await run(tenantGuard(), { user: { sub: 'u1' } } as Request);
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(mockLog).toHaveBeenCalled();
  });

  it('tenantGuard passes with institution context', async () => {
    const { err } = await run(
      tenantGuard(),
      { user: { sub: 'u1', institutionId: 'inst' } } as Request,
    );
    expect(err).toBeUndefined();
  });

  it('facultyCourseGuard denies unassigned faculty', async () => {
    mockFacultyCanAccessCourse.mockResolvedValue(false);
    const req = {
      user: { sub: 'u1', role: 'faculty', email: 'f@test.com', institutionId: 'inst' },
      params: { courseId: 'course-1' },
      path: '/courses/course-1',
      method: 'GET',
    } as unknown as Request;

    const { err } = await run(facultyCourseGuard(), req);
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('studentOwnershipGuard allows self only', async () => {
    mockResolveStudentSelf.mockResolvedValue({ toString: () => 'stu-1' });
    const req = {
      user: { sub: 'u1', role: 'student', email: 's@test.com', institutionId: 'inst' },
      params: { id: 'stu-1' },
      path: '/students/stu-1',
      method: 'GET',
    } as unknown as Request;

    const ok = await run(studentOwnershipGuard('id'), req);
    expect(ok.err).toBeUndefined();

    const reqOther = { ...req, params: { id: 'other' } } as unknown as Request;
    const denied = await run(studentOwnershipGuard('id'), reqOther);
    expect(denied.err).toBeInstanceOf(ForbiddenError);
  });
});
