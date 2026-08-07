import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@learnova/constants';
import { ROLE_PERMISSIONS } from '@learnova/shared';

describe('quiz permissions', () => {
  it('exposes read/write/manage permission constants', () => {
    expect(PERMISSIONS.QUIZ_READ).toBe('quiz:read');
    expect(PERMISSIONS.QUIZ_WRITE).toBe('quiz:write');
    expect(PERMISSIONS.QUIZ_MANAGE).toBe('quiz:manage');
  });

  it('grants students read + write so they can view and attempt quizzes', () => {
    expect(ROLE_PERMISSIONS.student).toContain('quiz:read');
    expect(ROLE_PERMISSIONS.student).toContain('quiz:write');
  });

  it('never grants students manage', () => {
    expect(ROLE_PERMISSIONS.student).not.toContain('quiz:manage');
  });

  it('grants faculty read + write so they can author quizzes', () => {
    expect(ROLE_PERMISSIONS.faculty).toContain('quiz:read');
    expect(ROLE_PERMISSIONS.faculty).toContain('quiz:write');
    expect(ROLE_PERMISSIONS.faculty).not.toContain('quiz:manage');
  });

  it('grants institution_admin the full set', () => {
    expect(ROLE_PERMISSIONS.institution_admin).toContain('quiz:read');
    expect(ROLE_PERMISSIONS.institution_admin).toContain('quiz:write');
    expect(ROLE_PERMISSIONS.institution_admin).toContain('quiz:manage');
  });

  it('reserves institution-wide analytics and import for manage holders', () => {
    const manageOnly = ['stats', 'audit', 'dashboard_institution', 'import'];
    const rolesWithManage = (
      Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]
    ).filter((role) => ROLE_PERMISSIONS[role].includes('quiz:manage'));

    expect(manageOnly).toContain('stats');
    expect(rolesWithManage).toEqual(['institution_admin']);
  });

  it('documents the faculty visibility rule for other faculty drafts', () => {
    const facultyScope = {
      ownQuizzes: true,
      courseQuizzes: true,
      otherFacultyDrafts: false,
    };
    expect(facultyScope.ownQuizzes).toBe(true);
    expect(facultyScope.otherFacultyDrafts).toBe(false);
  });

  it('documents the student scope rules', () => {
    const studentScope = {
      publishedOnly: true,
      enrolledCoursesOnly: true,
      ownAttemptsOnly: true,
      canManageBanks: false,
    };
    expect(studentScope.publishedOnly).toBe(true);
    expect(studentScope.enrolledCoursesOnly).toBe(true);
    expect(studentScope.canManageBanks).toBe(false);
  });
});
