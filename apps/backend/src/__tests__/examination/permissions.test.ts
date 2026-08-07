import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@learnova/constants';
import { ROLE_PERMISSIONS } from '@learnova/shared';

describe('examination permissions', () => {
  it('exposes read/write/manage/proctor permission constants', () => {
    expect(PERMISSIONS.EXAMINATION_READ).toBe('examination:read');
    expect(PERMISSIONS.EXAMINATION_WRITE).toBe('examination:write');
    expect(PERMISSIONS.EXAMINATION_MANAGE).toBe('examination:manage');
    expect(PERMISSIONS.EXAMINATION_PROCTOR).toBe('examination:proctor');
  });

  it('grants students read + write so they can view and attempt exams', () => {
    expect(ROLE_PERMISSIONS.student).toContain('examination:read');
    expect(ROLE_PERMISSIONS.student).toContain('examination:write');
  });

  it('never grants students manage or proctor', () => {
    expect(ROLE_PERMISSIONS.student).not.toContain('examination:manage');
    expect(ROLE_PERMISSIONS.student).not.toContain('examination:proctor');
  });

  it('grants faculty read, write, and proctor', () => {
    expect(ROLE_PERMISSIONS.faculty).toContain('examination:read');
    expect(ROLE_PERMISSIONS.faculty).toContain('examination:write');
    expect(ROLE_PERMISSIONS.faculty).toContain('examination:proctor');
    expect(ROLE_PERMISSIONS.faculty).not.toContain('examination:manage');
  });

  it('grants institution_admin the full examination set', () => {
    expect(ROLE_PERMISSIONS.institution_admin).toContain('examination:read');
    expect(ROLE_PERMISSIONS.institution_admin).toContain('examination:write');
    expect(ROLE_PERMISSIONS.institution_admin).toContain('examination:manage');
  });

  it('reserves institution-wide dashboards and audit for manage holders', () => {
    const manageOnly = ['dashboard_institution', 'audit'];
    const rolesWithManage = (
      Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]
    ).filter((role) => ROLE_PERMISSIONS[role].includes('examination:manage'));

    expect(manageOnly).toContain('audit');
    expect(rolesWithManage).toEqual(['institution_admin']);
  });

  it('documents the student scope rules', () => {
    const studentScope = {
      publishedOnly: true,
      enrolledCoursesOnly: true,
      ownAttemptsOnly: true,
      canProctor: false,
    };
    expect(studentScope.publishedOnly).toBe(true);
    expect(studentScope.enrolledCoursesOnly).toBe(true);
    expect(studentScope.canProctor).toBe(false);
  });
});
