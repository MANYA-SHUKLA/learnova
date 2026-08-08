import { AUTH } from '@learnova/constants';
import type { DeviceType } from '@learnova/types';

export interface ClientContext {
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
}

export function parseUserAgent(ua: string | null): {
  browser: string | null;
  os: string | null;
  deviceType: DeviceType;
} {
  if (!ua) {
    return { browser: null, os: null, deviceType: 'unknown' };
  }

  const lower = ua.toLowerCase();

  let browser: string | null = null;
  if (lower.includes('edg/')) browser = 'Edge';
  else if (lower.includes('chrome/')) browser = 'Chrome';
  else if (lower.includes('firefox/')) browser = 'Firefox';
  else if (lower.includes('safari/') && !lower.includes('chrome')) browser = 'Safari';
  else if (lower.includes('opera') || lower.includes('opr/')) browser = 'Opera';

  let os: string | null = null;
  if (lower.includes('android')) os = 'Android';
  else if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ipod')) os = 'iOS';
  else if (lower.includes('windows')) os = 'Windows';
  else if (lower.includes('mac os') || lower.includes('macintosh')) os = 'macOS';
  else if (lower.includes('linux')) os = 'Linux';

  let deviceType: DeviceType = 'desktop';
  if (lower.includes('ipad') || lower.includes('tablet')) deviceType = 'tablet';
  else if (
    lower.includes('mobi') ||
    lower.includes('iphone') ||
    lower.includes('android')
  ) {
    deviceType = 'mobile';
  }

  return { browser, os, deviceType };
}

export function computeLockUntil(failedAttempts: number): Date | null {
  if (failedAttempts < AUTH.MAX_FAILED_ATTEMPTS) return null;
  const exponent = failedAttempts - AUTH.MAX_FAILED_ATTEMPTS;
  const ms = AUTH.LOCK_BASE_MS * 2 ** Math.max(0, exponent);
  return new Date(Date.now() + ms);
}
