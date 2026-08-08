import { describe, expect, it } from 'vitest';
import {
  getPermissionsForRole,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from '@learnova/shared';

describe('RBAC permission matrix', () => {
  it('gives institution_admin institution:manage', () => {
    const perms = getPermissionsForRole('institution_admin');
    expect(hasPermission(perms, 'institution:manage')).toBe(true);
    expect(hasPermission(perms, 'users:manage')).toBe(true);
  });

  it('restricts faculty from institution permissions', () => {
    const perms = getPermissionsForRole('faculty');
    expect(hasPermission(perms, 'institution:read')).toBe(false);
    expect(hasPermission(perms, 'institution:manage')).toBe(false);
    expect(hasAllPermissions(perms, ['lms:read', 'lms:write'])).toBe(true);
  });

  it('restricts student from institution and faculty permissions', () => {
    const perms = getPermissionsForRole('student');
    expect(hasPermission(perms, 'institution:read')).toBe(false);
    expect(hasPermission(perms, 'faculty:read')).toBe(false);
  });

  it('supports hasAll / hasAny helpers', () => {
    const perms = getPermissionsForRole('faculty');
    expect(hasAllPermissions(perms, ['lms:read', 'lms:write'])).toBe(true);
    expect(hasAllPermissions(perms, ['lms:read', 'roles:manage'])).toBe(false);
    expect(hasAnyPermission(perms, ['roles:manage', 'ide:access'])).toBe(true);
  });

  it('keeps future roles empty until activated', () => {
    expect(getPermissionsForRole('super_admin')).toEqual([]);
    expect(getPermissionsForRole('parent')).toEqual([]);
  });
});
