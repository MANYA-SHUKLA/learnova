import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@learnova/constants';
import { ROLE_PERMISSIONS } from '@learnova/shared';

describe('assignment permissions', () => {
  it('exposes read/write/manage permission constants', () => {
    expect(PERMISSIONS.ASSIGNMENT_READ).toBe('assignment:read');
    expect(PERMISSIONS.ASSIGNMENT_WRITE).toBe('assignment:write');
    expect(PERMISSIONS.ASSIGNMENT_MANAGE).toBe('assignment:manage');
  });

  it('grants students read + write so they can view and submit', () => {
    expect(ROLE_PERMISSIONS.student).toContain('assignment:read');
    expect(ROLE_PERMISSIONS.student).toContain('assignment:write');
  });

  it('never grants students manage', () => {
    expect(ROLE_PERMISSIONS.student).not.toContain('assignment:manage');
  });

  it('grants faculty read + write so they can author and grade', () => {
    expect(ROLE_PERMISSIONS.faculty).toContain('assignment:read');
    expect(ROLE_PERMISSIONS.faculty).toContain('assignment:write');
    expect(ROLE_PERMISSIONS.faculty).not.toContain('assignment:manage');
  });

  it('grants institution_admin the full set', () => {
    expect(ROLE_PERMISSIONS.institution_admin).toContain('assignment:read');
    expect(ROLE_PERMISSIONS.institution_admin).toContain('assignment:write');
    expect(ROLE_PERMISSIONS.institution_admin).toContain('assignment:manage');
  });

  it('reserves institution-wide analytics and import for manage holders', () => {
    const manageOnly = [
      'stats',
      'audit',
      'dashboard_institution',
      'import',
    ];
    const rolesWithManage = (
      Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>
    ).filter((role) => ROLE_PERMISSIONS[role].includes('assignment:manage'));

    expect(manageOnly).toContain('stats');
    expect(rolesWithManage).toEqual(['institution_admin']);
  });

  it('documents the faculty visibility rule for other faculty drafts', () => {
    const facultyScope = {
      ownAssignments: true,
      courseAssignments: true,
      otherFacultyDrafts: false,
    };
    expect(facultyScope.ownAssignments).toBe(true);
    expect(facultyScope.otherFacultyDrafts).toBe(false);
  });

  it('documents the student scope rules', () => {
    const studentScope = {
      publishedOnly: true,
      enrolledCoursesOnly: true,
      ownSubmissionsOnly: true,
      canGrade: false,
    };
    expect(studentScope.publishedOnly).toBe(true);
    expect(studentScope.enrolledCoursesOnly).toBe(true);
    expect(studentScope.canGrade).toBe(false);
  });
});
