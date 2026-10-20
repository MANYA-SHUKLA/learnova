/**
 * Edge middleware role routing — no workspace package imports (Edge cannot load node:crypto).
 */

export type EdgeActiveRole = 'institution_admin' | 'faculty' | 'student' | 'super_admin';

const ACTIVE_ROLES: readonly EdgeActiveRole[] = [
  'institution_admin',
  'faculty',
  'student',
  'super_admin',
];

const SUPERADMIN_PREFIX = '/console';

const INSTITUTION_PREFIX = '/institution';
const FACULTY_PREFIX = '/faculty';
const STUDENT_PREFIX = '/student';

const DASHBOARD_BY_ROLE: Record<EdgeActiveRole, string> = {
  institution_admin: `${INSTITUTION_PREFIX}/dashboard`,
  faculty: `${FACULTY_PREFIX}/dashboard`,
  student: `${STUDENT_PREFIX}/dashboard`,
  super_admin: SUPERADMIN_PREFIX,
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
  if (
    normalized === '/superadmin/signin' ||
    normalized === '/superadmin/login' ||
    normalized === `${SUPERADMIN_PREFIX}/sign-in`
  ) {
    return null;
  }
  if (normalized === SUPERADMIN_PREFIX || normalized.startsWith(`${SUPERADMIN_PREFIX}/`)) {
    return 'super_admin';
  }
  if (normalized === '/superadmin' || normalized.startsWith('/superadmin/')) {
    return 'super_admin';
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
