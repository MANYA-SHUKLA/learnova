/** Role string constants — avoid magic strings in auth/RBAC code */

export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  INSTITUTION_ADMIN: 'institution_admin',
  SUPER_ADMIN: 'super_admin',
  TEACHING_ASSISTANT: 'teaching_assistant',
  PLACEMENT_OFFICER: 'placement_officer',
  PARENT: 'parent',
} as const;

export type RoleConstant = (typeof ROLES)[keyof typeof ROLES];

export const ACTIVE_ROLE_VALUES = [
  ROLES.STUDENT,
  ROLES.FACULTY,
  ROLES.INSTITUTION_ADMIN,
] as const;
