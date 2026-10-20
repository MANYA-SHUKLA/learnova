/**
 * Post-login and setup routing helpers — UI only.
 */

import type { ActiveRole } from '@learnova/types';
import { APP_ROUTES } from '@learnova/constants';
import { institutionApi } from '@/features/institution/services/institution-api';
import { isInstitutionNotFound, isInstitutionSetupComplete } from '@/lib/onboarding';

/** Post-login home by role — UI routing only. */
export function dashboardPathForRole(role: ActiveRole | string | null | undefined): string {
  switch (role) {
    case 'faculty':
      return APP_ROUTES.FACULTY_DASHBOARD;
    case 'student':
      return APP_ROUTES.STUDENT_DASHBOARD;
    case 'super_admin':
      return APP_ROUTES.CONSOLE;
    case 'institution_admin':
    default:
      return APP_ROUTES.INSTITUTION_DASHBOARD;
  }
}

/**
 * Institution admins without a completed profile go to /institution/setup.
 */
function normalizeLoginNextPath(nextPath: string): string {
  if (
    nextPath === '/superadmin/login' ||
    nextPath.startsWith('/superadmin/login?') ||
    nextPath === '/console/sign-in' ||
    nextPath.startsWith('/console/sign-in?')
  ) {
    return APP_ROUTES.SUPERADMIN_SIGN_IN;
  }
  return nextPath;
}

export async function resolvePostLoginPath(
  role: ActiveRole | string | null | undefined,
  nextPath?: string | null,
): Promise<string> {
  if (nextPath) return normalizeLoginNextPath(nextPath);

  if (role === 'institution_admin') {
    try {
      const institution = await institutionApi.getMe();
      if (!isInstitutionSetupComplete(institution)) {
        return APP_ROUTES.INSTITUTION_SETUP;
      }
    } catch (error) {
      if (isInstitutionNotFound(error)) {
        return APP_ROUTES.INSTITUTION_SETUP;
      }
    }
  }

  return dashboardPathForRole(role);
}
