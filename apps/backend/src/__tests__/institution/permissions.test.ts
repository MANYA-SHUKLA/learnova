import { describe, expect, it } from 'vitest';
import {
  getPermissionsForRole,
  hasPermission,
} from '@learnova/shared';

describe('institution permissions', () => {
  it('allows institution_admin to read and manage institution', () => {
    const perms = getPermissionsForRole('institution_admin');
    expect(hasPermission(perms, 'institution:read')).toBe(true);
    expect(hasPermission(perms, 'institution:manage')).toBe(true);
  });

  it('allows faculty read-only institution access', () => {
    const perms = getPermissionsForRole('faculty');
    expect(hasPermission(perms, 'institution:read')).toBe(true);
    expect(hasPermission(perms, 'institution:manage')).toBe(false);
  });

  it('denies student institution access', () => {
    const perms = getPermissionsForRole('student');
    expect(hasPermission(perms, 'institution:read')).toBe(false);
    expect(hasPermission(perms, 'institution:manage')).toBe(false);
  });
});
