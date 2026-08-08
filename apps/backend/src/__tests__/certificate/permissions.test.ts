import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@learnova/constants';
import { getPermissionsForRole, hasPermission } from '@learnova/shared';

describe('certificate permissions', () => {
  it('defines certificate read/write/manage permissions', () => {
    expect(PERMISSIONS.CERTIFICATE_READ).toBe('certificate:read');
    expect(PERMISSIONS.CERTIFICATE_WRITE).toBe('certificate:write');
    expect(PERMISSIONS.CERTIFICATE_MANAGE).toBe('certificate:manage');
  });

  it('grants students read-only certificate access', () => {
    const perms = getPermissionsForRole('student');
    expect(hasPermission(perms, PERMISSIONS.CERTIFICATE_READ)).toBe(true);
    expect(hasPermission(perms, PERMISSIONS.CERTIFICATE_WRITE)).toBe(false);
  });

  it('grants faculty certificate read/write', () => {
    const perms = getPermissionsForRole('faculty');
    expect(hasPermission(perms, PERMISSIONS.CERTIFICATE_WRITE)).toBe(true);
  });

  it('grants institution admins full certificate access', () => {
    const perms = getPermissionsForRole('institution_admin');
    expect(hasPermission(perms, PERMISSIONS.CERTIFICATE_MANAGE)).toBe(true);
  });
});
