import { describe, expect, it } from 'vitest';
import { computeLockUntil, parseUserAgent } from '../../services/auth/auth.utils.js';

describe('parseUserAgent', () => {
  it('detects desktop Chrome on Windows', () => {
    const result = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    );
    expect(result.browser).toBe('Chrome');
    expect(result.os).toBe('Windows');
    expect(result.deviceType).toBe('desktop');
  });

  it('detects mobile Safari on iOS', () => {
    const result = parseUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
    );
    expect(result.browser).toBe('Safari');
    expect(result.os).toBe('iOS');
    expect(result.deviceType).toBe('mobile');
  });

  it('detects tablet', () => {
    const result = parseUserAgent(
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    );
    expect(result.deviceType).toBe('tablet');
  });

  it('handles null user agent', () => {
    expect(parseUserAgent(null)).toEqual({
      browser: null,
      os: null,
      deviceType: 'unknown',
    });
  });
});

describe('computeLockUntil', () => {
  it('returns null below max attempts', () => {
    expect(computeLockUntil(4)).toBeNull();
  });

  it('locks with exponential backoff at and above max attempts', () => {
    const first = computeLockUntil(5);
    const second = computeLockUntil(6);
    expect(first).toBeInstanceOf(Date);
    expect(second).toBeInstanceOf(Date);
    if (!(first instanceof Date) || !(second instanceof Date)) {
      throw new Error('expected lock dates');
    }
    expect(second.getTime() - Date.now()).toBeGreaterThan(
      (first.getTime() - Date.now()) * 1.5,
    );
  });
});
