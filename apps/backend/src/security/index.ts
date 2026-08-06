/**
 * Security infrastructure — prepared only. No authentication flows.
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import bcrypt from 'bcrypt';
import { createId } from '@learnova/utils';
import { securityConfig } from '../config/slices.js';

/** CSRF token abstraction — enable via CSRF_ENABLED later */
export const csrf = {
  generate(): string {
    return randomBytes(32).toString('hex');
  },
  cookieName(): string {
    return securityConfig.csrfCookieName;
  },
  enabled(): boolean {
    return securityConfig.csrfEnabled;
  },
  verify(expected: string, provided: string): boolean {
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  },
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, securityConfig.bcryptRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function generateUuid(): string {
  return createId();
}

export function sha256Hash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function hmacSign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Symmetric encryption helpers — require ENCRYPTION_KEY (≥32 chars).
 * Uses AES-256-GCM when key present; throws if missing at call time.
 */
export function encrypt(plaintext: string, key = securityConfig.encryptionKey): string {
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY (≥32 chars) required for encrypt()');
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key.slice(0, 32)), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(payload: string, key = securityConfig.encryptionKey): string {
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY (≥32 chars) required for decrypt()');
  }
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key.slice(0, 32)), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
