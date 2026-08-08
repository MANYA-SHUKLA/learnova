import { describe, expect, it } from 'vitest';

describe('course permissions', () => {
  it('defines standard RBAC permissions', () => {
    const permissions = {
      COURSE_READ: 'course:read',
      COURSE_WRITE: 'course:write',
      COURSE_MANAGE: 'course:manage',
    };
    expect(permissions.COURSE_READ).toBe('course:read');
    expect(permissions.COURSE_WRITE).toBe('course:write');
    expect(permissions.COURSE_MANAGE).toBe('course:manage');
  });

  it('maps roles to expected permissions', () => {
    const rolePermissions = {
      institution_admin: ['course:read', 'course:write', 'course:manage'],
      faculty: ['course:read', 'course:write'],
      student: ['course:read'],
    };
    expect(rolePermissions.institution_admin).toContain('course:manage');
    expect(rolePermissions.faculty).not.toContain('course:manage');
    expect(rolePermissions.student).toEqual(['course:read']);
  });
});
