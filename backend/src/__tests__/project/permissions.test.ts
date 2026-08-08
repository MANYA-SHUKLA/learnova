import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@learnova/constants';
import { ROLE_PERMISSIONS } from '@learnova/shared';

describe('project permissions', () => {
  it('exposes read/write/manage permission constants', () => {
    expect(PERMISSIONS.PROJECT_READ).toBe('project:read');
    expect(PERMISSIONS.PROJECT_WRITE).toBe('project:write');
    expect(PERMISSIONS.PROJECT_MANAGE).toBe('project:manage');
  });

  it('grants students read + write so they can view and submit', () => {
    expect(ROLE_PERMISSIONS.student).toContain('project:read');
    expect(ROLE_PERMISSIONS.student).toContain('project:write');
  });

  it('never grants students manage', () => {
    expect(ROLE_PERMISSIONS.student).not.toContain('project:manage');
  });

  it('grants faculty read + write so they can author and grade', () => {
    expect(ROLE_PERMISSIONS.faculty).toContain('project:read');
    expect(ROLE_PERMISSIONS.faculty).toContain('project:write');
    expect(ROLE_PERMISSIONS.faculty).not.toContain('project:manage');
  });

  it('grants institution_admin the full set', () => {
    expect(ROLE_PERMISSIONS.institution_admin).toContain('project:read');
    expect(ROLE_PERMISSIONS.institution_admin).toContain('project:write');
    expect(ROLE_PERMISSIONS.institution_admin).toContain('project:manage');
  });
});
