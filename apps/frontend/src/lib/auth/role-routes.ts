/**
 * Role ↔ route prefix mapping for client layouts.
 * Edge middleware uses edge-role-routes.ts (no workspace imports).
 */

export {
  dashboardPathForRoleCookie,
  isActiveRole,
  isPathAllowedForRole,
  requiredRoleForPath,
} from '@/lib/auth/edge-role-routes';
