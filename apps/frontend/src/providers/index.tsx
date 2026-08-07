'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';
import { RoleProvider } from './role-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <RoleProvider>{children}</RoleProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
