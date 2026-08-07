import type { Permission, Role } from '@learnova/types';

/**
 * Role → Permission matrix.
 * Single source of truth for authorization decisions.
 * Auth implementation will consume this — do not hardcode permissions elsewhere.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  student: [
    'lms:read',
    'examination:read',
    'coding:read',
    'coding:submit',
    'ide:access',
    'ideation:read',
    'ideation:write',
    'analytics:read',
    'faculty:read',
    'student:read',
    'student:write',
    'course:read',
    'enrollment:read',
    'enrollment:write',
    'progress:read',
    'progress:write',
    'assignment:read',
    'assignment:write',
    'lab:read',
    'lab:write',
    'project:read',
    'project:write',
    'quiz:read',
    'quiz:write',
  ],
  faculty: [
    'lms:read',
    'lms:write',
    'erp:read',
    'examination:read',
    'examination:write',
    'examination:proctor',
    'coding:read',
    'coding:write',
    'ide:access',
    'ideation:read',
    'analytics:read',
    'analytics:export',
    'users:read',
    'institution:read',
    'faculty:read',
    'faculty:write',
    'student:read',
    'course:read',
    'course:write',
    'enrollment:read',
    'enrollment:write',
    'progress:read',
    'progress:write',
    'assignment:read',
    'assignment:write',
    'lab:read',
    'lab:write',
    'project:read',
    'project:write',
    'quiz:read',
    'quiz:write',
  ],
  institution_admin: [
    'lms:read',
    'lms:write',
    'lms:manage',
    'erp:read',
    'erp:write',
    'erp:manage',
    'examination:read',
    'examination:write',
    'examination:manage',
    'coding:read',
    'coding:write',
    'ide:access',
    'ideation:read',
    'ideation:write',
    'analytics:read',
    'analytics:export',
    'audit:read',
    'users:read',
    'users:manage',
    'roles:manage',
    'institution:read',
    'institution:manage',
    'faculty:read',
    'faculty:write',
    'faculty:manage',
    'student:read',
    'student:write',
    'student:manage',
    'course:read',
    'course:write',
    'course:manage',
    'enrollment:read',
    'enrollment:write',
    'enrollment:manage',
    'progress:read',
    'progress:write',
    'progress:manage',
    'assignment:read',
    'assignment:write',
    'assignment:manage',
    'lab:read',
    'lab:write',
    'lab:manage',
    'project:read',
    'project:write',
    'project:manage',
    'quiz:read',
    'quiz:write',
    'quiz:manage',
  ],
  // Future roles — empty until activated
  super_admin: [],
  teaching_assistant: [
    'project:read',
    'project:write',
  ],
  placement_officer: [],
  parent: [],
} as const;

export function getPermissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(
  permissions: readonly Permission[],
  required: Permission,
): boolean {
  return permissions.includes(required);
}

export function hasAllPermissions(
  permissions: readonly Permission[],
  required: readonly Permission[],
): boolean {
  return required.every((p) => permissions.includes(p));
}

export function hasAnyPermission(
  permissions: readonly Permission[],
  required: readonly Permission[],
): boolean {
  return required.some((p) => permissions.includes(p));
}
