/**
 * Role ↔ route prefix mapping for middleware and client layouts.
 * Kept inline (not @learnova/shared) so Next.js edge middleware stays lightweight.
 */

import type { ActiveRole } from '@learnova/types';
import { APP_ROUTES } from '@learnova/constants';

const ACTIVE_ROLES: readonly ActiveRole[] = ['institution_admin', 'faculty', 'student'];

export function isActiveRole(value: string | null | undefined): value is ActiveRole {
  return Boolean(value && ACTIVE_ROLES.includes(value as ActiveRole));
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

export function dashboardPathForRoleCookie(role: ActiveRole): string {
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
