import type { ModuleName, Role, RoleDefinition } from '@learnova/types';
import { ROLE_PERMISSIONS } from '../permissions/index.js';

const ROLE_MODULES: Record<Role, readonly ModuleName[]> = {
  student: ['lms', 'examination', 'coding', 'ide', 'ideation', 'analytics'],
  faculty: ['lms', 'erp', 'examination', 'coding', 'ide', 'ideation', 'analytics'],
  institution_admin: [
    'lms',
    'erp',
    'examination',
    'coding',
    'ide',
    'ideation',
    'analytics',
    'audit',
  ],
  super_admin: [
    'lms',
    'erp',
    'examination',
    'coding',
    'ide',
    'ideation',
    'analytics',
    'audit',
  ],
  teaching_assistant: ['lms', 'examination', 'coding', 'ide'],
  placement_officer: ['erp', 'analytics'],
  parent: ['analytics'],
};

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  student: {
    role: 'student',
    label: 'Student',
    description: 'Enrolled learner with access to courses, exams, coding, and IDE.',
    permissions: [...ROLE_PERMISSIONS.student],
    modules: [...ROLE_MODULES.student],
    isActive: true,
  },
  faculty: {
    role: 'faculty',
    label: 'Faculty',
    description: 'Instructor with course, exam, and grading capabilities.',
    permissions: [...ROLE_PERMISSIONS.faculty],
    modules: [...ROLE_MODULES.faculty],
    isActive: true,
  },
  institution_admin: {
    role: 'institution_admin',
    label: 'Institution Admin',
    description: 'Institution-level administrator with full module oversight.',
    permissions: [...ROLE_PERMISSIONS.institution_admin],
    modules: [...ROLE_MODULES.institution_admin],
    isActive: true,
  },
  super_admin: {
    role: 'super_admin',
    label: 'Super Admin',
    description: 'Platform-wide administrator. Reserved for future release.',
    permissions: [...ROLE_PERMISSIONS.super_admin],
    modules: [...ROLE_MODULES.super_admin],
    isActive: false,
  },
  teaching_assistant: {
    role: 'teaching_assistant',
    label: 'Teaching Assistant',
    description: 'Supports faculty on courses and grading. Reserved for future release.',
    permissions: [...ROLE_PERMISSIONS.teaching_assistant],
    modules: [...ROLE_MODULES.teaching_assistant],
    isActive: false,
  },
  placement_officer: {
    role: 'placement_officer',
    label: 'Placement Officer',
    description: 'Manages placements and career analytics. Reserved for future release.',
    permissions: [...ROLE_PERMISSIONS.placement_officer],
    modules: [...ROLE_MODULES.placement_officer],
    isActive: false,
  },
  parent: {
    role: 'parent',
    label: 'Parent',
    description: 'Guardian view of student progress. Reserved for future release.',
    permissions: [...ROLE_PERMISSIONS.parent],
    modules: [...ROLE_MODULES.parent],
    isActive: false,
  },
};

export const ACTIVE_ROLES: readonly Role[] = Object.values(ROLE_DEFINITIONS)
  .filter((d) => d.isActive)
  .map((d) => d.role);

export function isActiveRole(role: Role): boolean {
  return ROLE_DEFINITIONS[role].isActive;
}

export function roleHasModuleAccess(role: Role, module: ModuleName): boolean {
  return ROLE_MODULES[role].includes(module);
}
