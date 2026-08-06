'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AppSidebar } from './app-sidebar';
import { AppTopbar } from './app-topbar';

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className={cn('flex-1 px-4 py-6 sm:px-6 lg:px-8', className)}>
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
