import type { ActiveRole } from '@learnova/types';
import { APP_ROUTES } from '@learnova/constants';

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
