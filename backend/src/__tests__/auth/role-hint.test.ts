import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../config/slices.js', () => ({
  jwtConfig: { accessSecret: 'test-access-secret-min-32-characters-long' },
}));

import { signRoleHint, verifyRoleHint } from '../../services/auth/role-hint.js';

describe('role-hint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('signs and verifies active roles', () => {
    const hint = signRoleHint('faculty');
    expect(hint).toBeTruthy();
    expect(verifyRoleHint(hint!)).toBe('faculty');
  });

  it('rejects tampered hints', () => {
    const hint = signRoleHint('student')!;
    const tampered = hint.replace('student', 'faculty');
    expect(verifyRoleHint(tampered)).toBeNull();
  });

  it('signs super_admin when active', () => {
    const hint = signRoleHint('super_admin');
    expect(hint).toBeTruthy();
    expect(verifyRoleHint(hint!)).toBe('super_admin');
  });
});
