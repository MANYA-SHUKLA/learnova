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
    case 'institution_admin':
    default:
      return APP_ROUTES.INSTITUTION_DASHBOARD;
  }
}

/**
 * Institution admins without a completed profile go to /institution/setup.
 * Email verification still happens before login (backend).
 */
export async function resolvePostLoginPath(
  role: ActiveRole | string | null | undefined,
  nextPath?: string | null,
): Promise<string> {
  if (nextPath) return nextPath;

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
