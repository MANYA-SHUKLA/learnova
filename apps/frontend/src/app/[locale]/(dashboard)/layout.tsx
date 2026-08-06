'use client';

import { Spinner } from '@learnova/ui';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/providers/auth-provider';

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
