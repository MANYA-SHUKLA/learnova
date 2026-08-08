/**
 * Re-export shared route guards for Next.js middleware and client layouts.
 */

export {
  dashboardPathForRole as dashboardPathForRoleCookie,
  isPathAllowedForRole,
  parseActiveRole as isActiveRole,
  requiredRoleForPath,
} from '@learnova/shared';
