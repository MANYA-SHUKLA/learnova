'use client';

/**
 * ProtectedRoute — UI gate for authenticated / permission-scoped views.
 */

import type { Permission, Role } from '@learnova/types';
import type { ReactNode } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRole } from '@/providers/role-provider';
import { can, canAll, canAny } from '@/lib/auth/permissions';
import { Spinner } from '@learnova/ui';

function DefaultDeniedFallback() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="text-base font-medium text-foreground">Access denied</p>
      <p className="text-sm text-muted-foreground">
        You do not have permission to view this page.
      </p>
    </div>
  );
}

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  roles?: Role[];
  permissions?: Permission[];
  permissionMode?: 'all' | 'any';
  fallback?: ReactNode;
  enforce?: boolean;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  roles,
  permissions,
  permissionMode = 'all',
  fallback = <DefaultDeniedFallback />,
  enforce = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, permissions: userPermissions } = useAuth();
  const { isRole } = useRole();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!enforce) {
    return <>{children}</>;
  }

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  if (roles && roles.length > 0 && !isRole(...roles)) {
    return <>{fallback}</>;
  }

  if (permissions && permissions.length > 0) {
    const allowed =
      permissionMode === 'all'
        ? canAll(userPermissions, permissions)
        : canAny(userPermissions, permissions);
    if (!allowed) return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function PermissionGate({
  permission,
  children,
  fallback = <DefaultDeniedFallback />,
  enforce = true,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
  enforce?: boolean;
}) {
  const { permissions, isLoading, isAuthenticated } = useAuth();
  if (!enforce) return <>{children}</>;
  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!isAuthenticated || !can(permissions, permission)) return <>{fallback}</>;
  return <>{children}</>;
}
