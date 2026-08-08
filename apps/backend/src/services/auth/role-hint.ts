/**
 * Signed role hint for Next.js edge middleware — UI navigation only, not API auth.
 */

import { AUTH } from '@learnova/constants';
import type { ActiveRole } from '@learnova/types';
import { isActiveRole } from '@learnova/shared';
import { jwtConfig } from '../../config/slices.js';
import { hmacSign } from '../../security/index.js';
import { timingSafeEqual } from 'node:crypto';

export function signRoleHint(role: string): string | null {
  if (!isActiveRole(role)) return null;
  const exp = Date.now() + AUTH.REFRESH_TTL_MS;
  const payload = `${role}.${exp}`;
  const sig = hmacSign(payload, jwtConfig.accessSecret);
  return `${payload}.${sig}`;
}

export function verifyRoleHint(hint: string): ActiveRole | null {
  const parts = hint.split('.');
  if (parts.length !== 3) return null;

  const [role, expStr, sig] = parts;
  if (!role || !expStr || !sig || !isActiveRole(role)) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;

  const payload = `${role}.${expStr}`;
  const expected = hmacSign(payload, jwtConfig.accessSecret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return role;
}
