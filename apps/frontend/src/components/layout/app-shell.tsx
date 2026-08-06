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
    <div className="flex min-h-0 min-h-svh w-full max-w-[100vw] overflow-x-clip bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <AppTopbar />
        <main
          className={cn(
            'min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8',
            className,
          )}
        >
          <div className="mx-auto w-full min-w-0 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
