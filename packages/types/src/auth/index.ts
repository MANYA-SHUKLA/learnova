/**
 * Auth & permission foundation types.
 * Login/session flows are NOT implemented — types prepare the contract only.
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
  | 'institution:manage';

export interface JwtPayload {
  sub: ID;
  email: string;
  role: Role;
  institutionId: ID | null;
  permissions: Permission[];
  sessionId: string;
  iat: number;
  exp: number;
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
}

export interface Session {
  id: ID;
  userId: ID;
  expiresAt: string;
  createdAt: string;
  userAgent: string | null;
  ipAddress: string | null;
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

/** Placeholder auth context — providers will hydrate this later */
export interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
}
