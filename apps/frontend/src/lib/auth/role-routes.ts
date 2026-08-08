/**
 * Re-export shared route guards for Next.js middleware and client layouts.
 */

export {
  dashboardPathForRole as dashboardPathForRoleCookie,
  isPathAllowedForRole,
  parseActiveRole,
  requiredRoleForPath,
} from '@learnova/shared';

/** Cookie role parser alias for middleware */
export { parseActiveRole as isActiveRole } from '@learnova/shared';
