/**
 * Auth & permission types — consumed by JWT, middleware, and frontend auth store.
 */

import type { ActiveRole, ID, Locale, ModuleName, Role } from '../common/index.js';

/** Fine-grained permission keys — extend per module as features land */
export type Permission =
  | 'lms:read'
  | 'lms:write'
  | 'lms:manage'
  | 'erp:read'
  | 'erp:write'
  | 'erp:manage'
  | 'examination:read'
  | 'examination:write'
  | 'examination:manage'
  | 'examination:proctor'
  | 'coding:read'
  | 'coding:write'
  | 'coding:submit'
  | 'ide:access'
  | 'ideation:read'
  | 'ideation:write'
  | 'analytics:read'
  | 'analytics:export'
  | 'audit:read'
  | 'users:read'
  | 'users:manage'
  | 'roles:manage'
  | 'institution:read'
  | 'institution:manage'
  | 'faculty:read'
  | 'faculty:write'
  | 'faculty:manage'
  | 'student:read'
  | 'student:write'
  | 'student:manage'
  | 'course:read'
  | 'course:write'
  | 'course:manage'
  | 'enrollment:read'
  | 'enrollment:write'
  | 'enrollment:manage'
  | 'progress:read'
  | 'progress:write'
  | 'progress:manage'
  | 'assignment:read'
  | 'assignment:write'
  | 'assignment:manage'
  | 'lab:read'
  | 'lab:write'
  | 'lab:manage'
  | 'project:read'
  | 'project:write'
  | 'project:manage'
  | 'quiz:read'
  | 'quiz:write'
  | 'quiz:manage'
  | 'gradebook:read'
  | 'gradebook:write'
  | 'gradebook:manage';

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface JwtPayload {
  sub: ID;
  email: string;
  role: Role;
  institutionId: ID | null;
  permissions: Permission[];
  sessionId: string;
  /** Token version — bumped on logout-all / password change */
  tv: number;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: ID;
  sessionId: string;
  familyId: string;
  version: number;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: ID;
  email: string;
  firstName: string;
  lastName: string;
  role: ActiveRole;
  institutionId: ID | null;
  permissions: Permission[];
  locale: Locale;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  /** Faculty/student first login must set a personal password */
  mustChangePassword: boolean;
}

export interface Session {
  id: ID;
  userId: ID;
  deviceType: DeviceType;
  expiresAt: string;
  createdAt: string;
  lastActivityAt: string;
  userAgent: string | null;
  ipAddress: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  isCurrent?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RoleDefinition {
  role: Role;
  label: string;
  description: string;
  permissions: Permission[];
  modules: ModuleName[];
  isActive: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
}
