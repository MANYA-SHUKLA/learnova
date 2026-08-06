/**
 * Permission helpers for UI gates.
 */

import type { Permission } from '@learnova/types';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from '@learnova/shared';

export function can(permissions: readonly Permission[], required: Permission): boolean {
  return hasPermission(permissions, required);
}

export function canAll(
  permissions: readonly Permission[],
  required: readonly Permission[],
): boolean {
  return hasAllPermissions(permissions, required);
}

export function canAny(
  permissions: readonly Permission[],
  required: readonly Permission[],
): boolean {
  return hasAnyPermission(permissions, required);
}
