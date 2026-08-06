'use client';

/**
 * RoleProvider — role & module access context.
 * Built on AuthProvider; ready for RBAC UI gates.
 */

import type { ModuleName, Role } from '@learnova/types';
import { isActiveRole, roleHasModuleAccess } from '@learnova/shared';
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from './auth-provider';

interface RoleContextValue {
  role: Role | null;
  isActive: boolean;
  hasModuleAccess: (module: ModuleName) => boolean;
  isRole: (...roles: Role[]) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const role = user?.role ?? null;

  const value = useMemo<RoleContextValue>(
    () => ({
      role,
      isActive: role ? isActiveRole(role) : false,
      hasModuleAccess: (module: ModuleName) =>
        role ? roleHasModuleAccess(role, module) : false,
      isRole: (...roles: Role[]) => (role ? roles.includes(role) : false),
    }),
    [role],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return ctx;
}
