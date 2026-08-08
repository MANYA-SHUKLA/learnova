/**
 * Edge middleware role routing — no workspace package imports (Edge cannot load node:crypto).
 */

export type EdgeActiveRole = 'institution_admin' | 'faculty' | 'student';

const ACTIVE_ROLES: readonly EdgeActiveRole[] = ['institution_admin', 'faculty', 'student'];

const INSTITUTION_PREFIX = '/institution';
const FACULTY_PREFIX = '/faculty';
const STUDENT_PREFIX = '/student';

const DASHBOARD_BY_ROLE: Record<EdgeActiveRole, string> = {
  institution_admin: `${INSTITUTION_PREFIX}/dashboard`,
  faculty: `${FACULTY_PREFIX}/dashboard`,
  student: `${STUDENT_PREFIX}/dashboard`,
};

export function isActiveRole(value: string | null | undefined): value is EdgeActiveRole {
  return Boolean(value && ACTIVE_ROLES.includes(value as EdgeActiveRole));
}

export function requiredRoleForPath(pathWithoutLocale: string): EdgeActiveRole | null {
  const normalized = pathWithoutLocale === '' ? '/' : pathWithoutLocale;
  if (
    normalized === INSTITUTION_PREFIX ||
    normalized.startsWith(`${INSTITUTION_PREFIX}/`)
  ) {
    return 'institution_admin';
  }
  if (normalized.startsWith(FACULTY_PREFIX)) {
    return 'faculty';
  }
  if (normalized.startsWith(STUDENT_PREFIX)) {
    return 'student';
  }
  return null;
}

export function isPathAllowedForRole(pathWithoutLocale: string, role: EdgeActiveRole): boolean {
  const required = requiredRoleForPath(pathWithoutLocale);
  if (!required) return true;
  return required === role;
}

export function dashboardPathForRoleCookie(role: EdgeActiveRole): string {
  return DASHBOARD_BY_ROLE[role];
}
