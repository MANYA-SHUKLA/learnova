import { PERMISSIONS } from '@learnova/constants';
import { ROLE_DEFINITIONS } from '@learnova/shared';
import type { Permission } from '@learnova/types';
import { Types } from 'mongoose';
import {
  permissionRepository,
  roleRepository,
} from '../repositories/auth/index.js';

const PERMISSION_META: Record<
  Permission,
  { resource: string; action: string; description: string }
> = {
  'lms:read': { resource: 'lms', action: 'read', description: 'View LMS content' },
  'lms:write': { resource: 'lms', action: 'write', description: 'Create/update LMS content' },
  'lms:manage': { resource: 'lms', action: 'manage', description: 'Manage LMS settings' },
  'erp:read': { resource: 'erp', action: 'read', description: 'View ERP records' },
  'erp:write': { resource: 'erp', action: 'write', description: 'Create/update ERP records' },
  'erp:manage': { resource: 'erp', action: 'manage', description: 'Manage ERP settings' },
  'examination:read': {
    resource: 'examination',
    action: 'read',
    description: 'View examinations',
  },
  'examination:write': {
    resource: 'examination',
    action: 'write',
    description: 'Create/update examinations',
  },
  'examination:manage': {
    resource: 'examination',
    action: 'manage',
    description: 'Manage examination settings',
  },
  'examination:proctor': {
    resource: 'examination',
    action: 'proctor',
    description: 'Proctor examinations',
  },
  'coding:read': { resource: 'coding', action: 'read', description: 'View coding labs' },
  'coding:write': {
    resource: 'coding',
    action: 'write',
    description: 'Create/update coding labs',
  },
  'coding:submit': {
    resource: 'coding',
    action: 'submit',
    description: 'Submit coding solutions',
  },
  'ide:access': { resource: 'ide', action: 'access', description: 'Access the IDE' },
  'ideation:read': {
    resource: 'ideation',
    action: 'read',
    description: 'View ideation boards',
  },
  'ideation:write': {
    resource: 'ideation',
    action: 'write',
    description: 'Contribute to ideation',
  },
  'analytics:read': {
    resource: 'analytics',
    action: 'read',
    description: 'View analytics',
  },
  'analytics:export': {
    resource: 'analytics',
    action: 'export',
    description: 'Export analytics',
  },
  'audit:read': { resource: 'audit', action: 'read', description: 'View audit logs' },
  'users:read': { resource: 'users', action: 'read', description: 'View users' },
  'users:manage': { resource: 'users', action: 'manage', description: 'Manage users' },
  'roles:manage': { resource: 'roles', action: 'manage', description: 'Manage roles' },
  'institution:read': {
    resource: 'institution',
    action: 'read',
    description: 'View institution hierarchy',
  },
  'institution:manage': {
    resource: 'institution',
    action: 'manage',
    description: 'Manage institution settings',
  },
  'faculty:read': {
    resource: 'faculty',
    action: 'read',
    description: 'View faculty directory and profiles',
  },
  'faculty:write': {
    resource: 'faculty',
    action: 'write',
    description: 'Update own faculty profile',
  },
  'faculty:manage': {
    resource: 'faculty',
    action: 'manage',
    description: 'Manage faculty records',
  },
  'student:read': {
    resource: 'student',
    action: 'read',
    description: 'View student directory and profiles',
  },
  'student:write': {
    resource: 'student',
    action: 'write',
    description: 'Update own student profile',
  },
  'student:manage': {
    resource: 'student',
    action: 'manage',
    description: 'Manage student records',
  },
  'course:read': {
    resource: 'course',
    action: 'read',
    description: 'View courses and progress',
  },
  'course:write': {
    resource: 'course',
    action: 'write',
    description: 'Create and edit own courses',
  },
  'course:manage': {
    resource: 'course',
    action: 'manage',
    description: 'Manage all institution courses',
  },
  'enrollment:read': {
    resource: 'enrollment',
    action: 'read',
    description: 'View enrollments',
  },
  'enrollment:write': {
    resource: 'enrollment',
    action: 'write',
    description: 'Request enrollment, withdraw own, or manage assigned-course enrollments',
  },
  'enrollment:manage': {
    resource: 'enrollment',
    action: 'manage',
    description: 'Full enrollment management including import/export and bulk ops',
  },
  'progress:read': {
    resource: 'progress',
    action: 'read',
    description: 'View learning progress',
  },
  'progress:write': {
    resource: 'progress',
    action: 'write',
    description: 'Update own or assigned learning progress',
  },
  'progress:manage': {
    resource: 'progress',
    action: 'manage',
    description: 'Manage institution-wide learning progress analytics',
  },
  'assignment:read': {
    resource: 'assignment',
    action: 'read',
    description: 'View assignments, submissions and grades',
  },
  'assignment:write': {
    resource: 'assignment',
    action: 'write',
    description: 'Create/update assignments, submit and grade work',
  },
  'assignment:manage': {
    resource: 'assignment',
    action: 'manage',
    description: 'Manage institution-wide assignments and analytics',
  },
  'project:read': {
    resource: 'project',
    action: 'read',
    description: 'View projects, teams, submissions and grades',
  },
  'project:write': {
    resource: 'project',
    action: 'write',
    description: 'Create/update projects, submit work and grade submissions',
  },
  'project:manage': {
    resource: 'project',
    action: 'manage',
    description: 'Manage institution-wide projects and analytics',
  },
  'quiz:read': {
    resource: 'quiz',
    action: 'read',
    description: 'View quizzes, question banks, and own results',
  },
  'quiz:write': {
    resource: 'quiz',
    action: 'write',
    description: 'Create quizzes, manage question banks, and attempt quizzes',
  },
  'quiz:manage': {
    resource: 'quiz',
    action: 'manage',
    description: 'Manage institution-wide quizzes, imports, and analytics',
  },
  'lab:read': {
    resource: 'lab',
    action: 'read',
    description: 'View practice labs, problems, and submissions',
  },
  'lab:write': {
    resource: 'lab',
    action: 'write',
    description: 'Create labs/problems, run and submit code',
  },
  'lab:manage': {
    resource: 'lab',
    action: 'manage',
    description: 'Manage institution-wide practice labs and analytics',
  },
};

export async function seedPermissions(): Promise<Map<string, string>> {
  const idByName = new Map<string, string>();
  for (const name of Object.values(PERMISSIONS) as Permission[]) {
    const meta = PERMISSION_META[name];
    const doc = await permissionRepository.upsert({
      name,
      resource: meta.resource,
      action: meta.action,
      description: meta.description,
    });
    idByName.set(name, String(doc._id));
  }
  return idByName;
}

export async function seedRoles(permissionIds: Map<string, string>): Promise<void> {
  for (const def of Object.values(ROLE_DEFINITIONS)) {
    const objectIds = def.permissions
      .map((p) => permissionIds.get(p))
      .filter((id): id is string => Boolean(id))
      .map((id) => new Types.ObjectId(id));

    await roleRepository.upsert({
      name: def.role,
      label: def.label,
      description: def.description,
      permissionIds: objectIds,
      isActive: def.isActive,
    });
  }
}

export async function seedAuth(): Promise<void> {
  const permissionIds = await seedPermissions();
  await seedRoles(permissionIds);
}
