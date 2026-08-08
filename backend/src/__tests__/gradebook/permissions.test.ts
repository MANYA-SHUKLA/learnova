import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@learnova/constants';
import { getPermissionsForRole, hasPermission } from '@learnova/shared';

describe('gradebook permissions', () => {
  it('defines GRADEBOOK_READ / WRITE / MANAGE', () => {
    expect(PERMISSIONS.GRADEBOOK_READ).toBe('gradebook:read');
    expect(PERMISSIONS.GRADEBOOK_WRITE).toBe('gradebook:write');
    expect(PERMISSIONS.GRADEBOOK_MANAGE).toBe('gradebook:manage');
  });

  it('grants students read-only gradebook access', () => {
    const perms = getPermissionsForRole('student');
    expect(hasPermission(perms, PERMISSIONS.GRADEBOOK_READ)).toBe(true);
    expect(hasPermission(perms, PERMISSIONS.GRADEBOOK_WRITE)).toBe(false);
  });

  it('grants faculty read/write gradebook access', () => {
    const perms = getPermissionsForRole('faculty');
    expect(hasPermission(perms, PERMISSIONS.GRADEBOOK_READ)).toBe(true);
    expect(hasPermission(perms, PERMISSIONS.GRADEBOOK_WRITE)).toBe(true);
    expect(hasPermission(perms, PERMISSIONS.GRADEBOOK_MANAGE)).toBe(false);
  });

  it('grants institution admins full gradebook access', () => {
    const perms = getPermissionsForRole('institution_admin');
    expect(hasPermission(perms, PERMISSIONS.GRADEBOOK_MANAGE)).toBe(true);
  });
});
