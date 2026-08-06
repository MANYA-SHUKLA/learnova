import { createHmac, createHash, randomBytes } from 'node:crypto';
import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * Session / token rotation unit tests — pure crypto + versioning rules
 * (mirrors AuthService.refresh rotation contract without Mongo).
 */

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

interface StoredRefresh {
  familyId: string;
  version: number;
  sessionId: string;
  tokenHash: string;
  revokedAt: Date | null;
}

function rotate(stored: StoredRefresh, presentedHash: string, presented: {
  familyId: string;
  version: number;
  sessionId: string;
}): { ok: true; next: StoredRefresh } | { ok: false; reason: string } {
  if (stored.revokedAt) {
    return { ok: false, reason: 'revoked' };
  }
  if (stored.tokenHash !== presentedHash) {
    return { ok: false, reason: 'hash_mismatch' };
  }
  if (
    stored.familyId !== presented.familyId ||
    stored.version !== presented.version ||
    stored.sessionId !== presented.sessionId
  ) {
    return { ok: false, reason: 'reuse_or_tamper' };
  }
  const nextRaw = randomBytes(32).toString('hex');
  return {
    ok: true,
    next: {
      familyId: stored.familyId,
      version: stored.version + 1,
      sessionId: stored.sessionId,
      tokenHash: sha256(nextRaw),
      revokedAt: null,
    },
  };
}

describe('refresh token rotation', () => {
  it('rotates version within the same family', () => {
    const raw = 'refresh-token-raw-value';
    const stored: StoredRefresh = {
      familyId: 'family-1',
      version: 0,
      sessionId: 'sess-1',
      tokenHash: sha256(raw),
      revokedAt: null,
    };

    const result = rotate(stored, sha256(raw), {
      familyId: 'family-1',
      version: 0,
      sessionId: 'sess-1',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.next.familyId).toBe('family-1');
      expect(result.next.version).toBe(1);
      expect(result.next.tokenHash).not.toBe(stored.tokenHash);
    }
  });

  it('rejects reuse with stale version', () => {
    const stored: StoredRefresh = {
      familyId: 'family-1',
      version: 2,
      sessionId: 'sess-1',
      tokenHash: sha256('current'),
      revokedAt: null,
    };

    const result = rotate(stored, sha256('current'), {
      familyId: 'family-1',
      version: 1,
      sessionId: 'sess-1',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('reuse_or_tamper');
  });

  it('rejects already revoked tokens', () => {
    const stored: StoredRefresh = {
      familyId: 'family-1',
      version: 0,
      sessionId: 'sess-1',
      tokenHash: sha256('x'),
      revokedAt: new Date(),
    };
    const result = rotate(stored, sha256('x'), {
      familyId: 'family-1',
      version: 0,
      sessionId: 'sess-1',
    });
    expect(result.ok).toBe(false);
  });
});

describe('token hashing', () => {
  it('is deterministic sha256', () => {
    expect(sha256('abc')).toBe(sha256('abc'));
    expect(sha256('abc')).not.toBe(sha256('abcd'));
  });

  it('hmac helper is stable', () => {
    const a = createHmac('sha256', 'secret').update('payload').digest('hex');
    const b = createHmac('sha256', 'secret').update('payload').digest('hex');
    expect(a).toBe(b);
  });
});

describe('session ownership guard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows self and admins only', () => {
    const canAccess = (actor: { sub: string; role: string }, resourceUserId: string) => {
      if (resourceUserId === actor.sub) return true;
      return actor.role === 'institution_admin' || actor.role === 'super_admin';
    };

    expect(canAccess({ sub: 'u1', role: 'student' }, 'u1')).toBe(true);
    expect(canAccess({ sub: 'u1', role: 'student' }, 'u2')).toBe(false);
    expect(canAccess({ sub: 'u1', role: 'institution_admin' }, 'u2')).toBe(true);
  });
});
