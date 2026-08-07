import { randomBytes } from 'node:crypto';

/**
 * Cryptographically random temporary password (12 chars).
 * Meets passwordSchema: upper, lower, digit, special.
 * Never log or persist the plain value except one-time admin handoff.
 */
export function generateTemporaryPassword(length = 12): string {
  const size = Math.max(12, Math.min(16, length));
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$%&*!';
  const all = upper + lower + digits + special;

  const pick = (alphabet: string) => alphabet[randomBytes(1)[0]! % alphabet.length]!;

  const chars = [pick(upper), pick(lower), pick(digits), pick(special)];
  while (chars.length < size) {
    chars.push(pick(all));
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomBytes(1)[0]! % (i + 1);
    const tmp = chars[i]!;
    chars[i] = chars[j]!;
    chars[j] = tmp;
  }

  return chars.join('');
}
