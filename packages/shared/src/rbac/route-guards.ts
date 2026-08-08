/**
 * Role ↔ URL prefix guards for middleware and client layouts.
 * API authorization remains the source of truth; this blocks cross-role navigation.
 */

import type { ActiveRole } from '@learnova/types';
import { APP_ROUTES } from '@learnova/constants';

const ACTIVE_ROLE_VALUES: readonly ActiveRole[] = ['institution_admin', 'faculty', 'student'];

export function parseActiveRole(value: string | null | undefined): ActiveRole | null {
  if (!value) return null;
  return ACTIVE_ROLE_VALUES.includes(value as ActiveRole) ? (value as ActiveRole) : null;
}

export function requiredRoleForPath(pathWithoutLocale: string): ActiveRole | null {
  const normalized = pathWithoutLocale === '' ? '/' : pathWithoutLocale;
  if (normalized === APP_ROUTES.INSTITUTION || normalized.startsWith(`${APP_ROUTES.INSTITUTION}/`)) {
    return 'institution_admin';
  }
  if (normalized.startsWith('/faculty')) {
    return 'faculty';
  }
  if (normalized.startsWith('/student')) {
    return 'student';
  }
  return null;
}

export function isPathAllowedForRole(pathWithoutLocale: string, role: ActiveRole): boolean {
  const required = requiredRoleForPath(pathWithoutLocale);
  if (!required) return true;
  return required === role;
}

export function dashboardPathForRole(role: ActiveRole): string {
  switch (role) {
    case 'faculty':
      return APP_ROUTES.FACULTY_DASHBOARD;
    case 'student':
      return APP_ROUTES.STUDENT_DASHBOARD;
    case 'institution_admin':
    default:
      return APP_ROUTES.INSTITUTION_DASHBOARD;
  }
}
