import { describe, expect, it } from 'vitest';
import { getPermissionsForRole, hasPermission } from '@learnova/shared';
import { PERMISSIONS } from '@learnova/constants';

describe('faculty permissions', () => {
  it('gives institution admin full faculty manage', () => {
    const perms = getPermissionsForRole('institution_admin');
    expect(hasPermission(perms, PERMISSIONS.FACULTY_READ)).toBe(true);
    expect(hasPermission(perms, PERMISSIONS.FACULTY_WRITE)).toBe(true);
    expect(hasPermission(perms, PERMISSIONS.FACULTY_MANAGE)).toBe(true);
  });

  it('gives faculty read + write but not manage', () => {
    const perms = getPermissionsForRole('faculty');
    expect(hasPermission(perms, PERMISSIONS.FACULTY_READ)).toBe(true);
    expect(hasPermission(perms, PERMISSIONS.FACULTY_WRITE)).toBe(true);
    expect(hasPermission(perms, PERMISSIONS.FACULTY_MANAGE)).toBe(false);
  });

  it('denies students faculty directory permissions', () => {
    const perms = getPermissionsForRole('student');
    expect(hasPermission(perms, PERMISSIONS.FACULTY_READ)).toBe(false);
    expect(hasPermission(perms, PERMISSIONS.FACULTY_MANAGE)).toBe(false);
  });
});
