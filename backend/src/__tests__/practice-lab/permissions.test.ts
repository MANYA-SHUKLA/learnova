import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@learnova/constants';
import { ROLE_PERMISSIONS } from '@learnova/shared';

describe('practice lab permissions', () => {
  it('exposes lab read/write/manage constants', () => {
    expect(PERMISSIONS.LAB_READ).toBe('lab:read');
    expect(PERMISSIONS.LAB_WRITE).toBe('lab:write');
    expect(PERMISSIONS.LAB_MANAGE).toBe('lab:manage');
  });

  it('grants students read + write for run/submit', () => {
    expect(ROLE_PERMISSIONS.student).toContain('lab:read');
    expect(ROLE_PERMISSIONS.student).toContain('lab:write');
    expect(ROLE_PERMISSIONS.student).not.toContain('lab:manage');
  });

  it('grants faculty read + write for own labs', () => {
    expect(ROLE_PERMISSIONS.faculty).toContain('lab:read');
    expect(ROLE_PERMISSIONS.faculty).toContain('lab:write');
    expect(ROLE_PERMISSIONS.faculty).not.toContain('lab:manage');
  });

  it('grants institution_admin full lab triad', () => {
    expect(ROLE_PERMISSIONS.institution_admin).toContain('lab:read');
    expect(ROLE_PERMISSIONS.institution_admin).toContain('lab:write');
    expect(ROLE_PERMISSIONS.institution_admin).toContain('lab:manage');
  });
});
