import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Hashing helpers — password hashing stays in apps (bcrypt); these are general-purpose */

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function createToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function maskSecret(value: string, visible = 4): string {
  if (value.length <= visible) return '*'.repeat(value.length);
  return `${'*'.repeat(Math.max(0, value.length - visible))}${value.slice(-visible)}`;
}
