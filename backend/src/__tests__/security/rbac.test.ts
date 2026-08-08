import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getPermissionsForRole,
  hasPermission,
  dashboardPathForRole,
  isPathAllowedForRole,
  parseActiveRole,
  requiredRoleForPath,
} from '@learnova/shared';

describe('RBAC route guards', () => {
  it('parses active role cookie values', () => {
    expect(parseActiveRole('student')).toBe('student');
    expect(parseActiveRole('faculty')).toBe('faculty');
    expect(parseActiveRole('institution_admin')).toBe('institution_admin');
    expect(parseActiveRole('super_admin')).toBeNull();
    expect(parseActiveRole('')).toBeNull();
  });

  it('maps URL prefixes to required roles', () => {
    expect(requiredRoleForPath('/institution/dashboard')).toBe('institution_admin');
    expect(requiredRoleForPath('/institution/students')).toBe('institution_admin');
    expect(requiredRoleForPath('/faculty/gradebook')).toBe('faculty');
    expect(requiredRoleForPath('/student/certificates')).toBe('student');
    expect(requiredRoleForPath('/account/sessions')).toBeNull();
  });

  it('blocks students from faculty and institution areas', () => {
    expect(isPathAllowedForRole('/faculty/dashboard', 'student')).toBe(false);
    expect(isPathAllowedForRole('/institution/settings', 'student')).toBe(false);
    expect(isPathAllowedForRole('/student/dashboard', 'student')).toBe(true);
  });

  it('blocks faculty from institution areas', () => {
    expect(isPathAllowedForRole('/institution/dashboard', 'faculty')).toBe(false);
    expect(isPathAllowedForRole('/faculty/dashboard', 'faculty')).toBe(true);
  });

  it('blocks faculty from student areas', () => {
    expect(isPathAllowedForRole('/student/dashboard', 'faculty')).toBe(false);
    expect(isPathAllowedForRole('/faculty/dashboard', 'faculty')).toBe(true);
  });

  it('blocks institution admin from student/faculty dashboards', () => {
    expect(isPathAllowedForRole('/student/dashboard', 'institution_admin')).toBe(false);
    expect(isPathAllowedForRole('/faculty/dashboard', 'institution_admin')).toBe(false);
    expect(isPathAllowedForRole('/institution/dashboard', 'institution_admin')).toBe(true);
  });

  it('returns role home paths', () => {
    expect(dashboardPathForRole('student')).toBe('/student/dashboard');
    expect(dashboardPathForRole('faculty')).toBe('/faculty/dashboard');
    expect(dashboardPathForRole('institution_admin')).toBe('/institution/dashboard');
  });
});

describe('RBAC permission matrix (production gates)', () => {
  it('denies students institution and faculty API permissions', () => {
    const perms = getPermissionsForRole('student');
    expect(hasPermission(perms, 'institution:read')).toBe(false);
    expect(hasPermission(perms, 'institution:manage')).toBe(false);
    expect(hasPermission(perms, 'faculty:read')).toBe(false);
    expect(hasPermission(perms, 'faculty:write')).toBe(false);
  });

  it('denies faculty institution management permissions', () => {
    const perms = getPermissionsForRole('faculty');
    expect(hasPermission(perms, 'institution:read')).toBe(false);
    expect(hasPermission(perms, 'institution:manage')).toBe(false);
    expect(hasPermission(perms, 'student:read')).toBe(true);
    expect(hasPermission(perms, 'course:read')).toBe(true);
  });

  it('grants institution admin institution management', () => {
    const perms = getPermissionsForRole('institution_admin');
    expect(hasPermission(perms, 'institution:read')).toBe(true);
    expect(hasPermission(perms, 'institution:manage')).toBe(true);
    expect(hasPermission(perms, 'student:manage')).toBe(true);
  });
});

describe('faculty teaching context scope helpers', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  function mockStudentModel() {
    vi.doMock('../../models/student.model.js', () => ({
      StudentModel: {
        findOne: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(null),
          }),
        }),
      },
    }));
  }

  it('resolves supervised courses from faculty assignment only', async () => {
    const facultyId = '507f1f77bcf86cd799439011';
    const courseId = '507f1f77bcf86cd799439012';

    mockStudentModel();
    vi.doMock('../../models/faculty.model.js', () => ({
      FacultyModel: {
        findOne: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue({ _id: facultyId }),
        }),
      },
    }));

    vi.doMock('../../models/course.model.js', () => ({
      CourseModel: {
        find: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([{ _id: courseId }]),
          }),
        }),
      },
    }));

    const { resolveFacultySupervisedCourseIds } = await import(
      '../../services/access/faculty-scope.js'
    );

    const ids = await resolveFacultySupervisedCourseIds(
      '507f1f77bcf86cd799439013',
      'faculty.demo@learnova.test',
    );

    expect(ids).toEqual([courseId]);
  });

  it('scopes enrolled students to supervised courses', async () => {
    const facultyId = '507f1f77bcf86cd799439011';
    const courseId = '507f1f77bcf86cd799439012';
    const studentId = '507f1f77bcf86cd799439014';

    mockStudentModel();
    vi.doMock('../../models/faculty.model.js', () => ({
      FacultyModel: {
        findOne: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue({ _id: facultyId }),
        }),
      },
    }));

    vi.doMock('../../models/course.model.js', () => ({
      CourseModel: {
        find: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([{ _id: courseId }]),
          }),
        }),
      },
    }));

    vi.doMock('../../models/enrollment.model.js', () => ({
      EnrollmentModel: {
        find: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([{ studentId }]),
          }),
        }),
      },
    }));

    const { resolveFacultyEnrolledStudentIds } = await import(
      '../../services/access/faculty-scope.js'
    );

    const ids = await resolveFacultyEnrolledStudentIds(
      '507f1f77bcf86cd799439013',
      'faculty.demo@learnova.test',
    );

    expect(ids.map(String)).toEqual([studentId]);
  });

  it('buildFacultySelfFilter restricts faculty directory to own record', async () => {
    const facultyId = '507f1f77bcf86cd799439011';

    vi.doMock('../../models/student.model.js', () => ({ StudentModel: {} }));
    vi.doMock('../../models/faculty.model.js', () => ({
      FacultyModel: {
        findOne: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue({ _id: facultyId }),
        }),
      },
    }));

    const { buildFacultySelfFilter } = await import('../../services/access/faculty-scope.js');

    const filter = await buildFacultySelfFilter(
      {},
      { role: 'faculty', email: 'f@test.com' },
      '507f1f77bcf86cd799439013',
    );
    expect(String(filter._id)).toBe(facultyId);

    const adminFilter = await buildFacultySelfFilter(
      { status: 'active' },
      { role: 'institution_admin', email: 'a@test.com' },
      '507f1f77bcf86cd799439013',
    );
    expect(adminFilter.status).toBe('active');
    expect(adminFilter._id).toBeUndefined();
  });
});
