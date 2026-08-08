/**
 * Edge-safe signed role hint verification for middleware.
 * Must stay free of Node-only imports.
 */

import type { EdgeActiveRole } from '@/lib/auth/edge-role-routes';

const ACTIVE_ROLES: readonly EdgeActiveRole[] = ['institution_admin', 'faculty', 'student'];

function isActiveRoleValue(value: string): value is EdgeActiveRole {
  return ACTIVE_ROLES.includes(value as EdgeActiveRole);
}

function secret(): string | null {
  return process.env.ROLE_HINT_SECRET ?? process.env.JWT_ACCESS_SECRET ?? null;
}

async function hmacSha256Hex(payload: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Parse signed role hint (`role.exp.sig`) or legacy plain role when no secret is configured. */
export async function parseRoleCookie(value: string | null | undefined): Promise<EdgeActiveRole | null> {
  if (!value) return null;

  const parts = value.split('.');
  if (parts.length === 3) {
    const key = secret();
    if (!key) return null;

    const [role, expStr, sig] = parts;
    if (!role || !expStr || !sig || !isActiveRoleValue(role)) return null;

    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp < Date.now()) return null;

    const payload = `${role}.${expStr}`;
    const expected = await hmacSha256Hex(payload, key);
    if (!timingSafeEqualHex(sig, expected)) return null;
    return role;
  }

  // Legacy unsigned cookie — allowed only when no signing secret is configured (local dev).
  if (secret()) return null;
  return isActiveRoleValue(value) ? value : null;
}
