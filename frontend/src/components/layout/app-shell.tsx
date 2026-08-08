'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { siteGutter } from '@/lib/layout';
import { AppSidebar } from './app-sidebar';
import { AppTopbar } from './app-topbar';
import { CommandPalette } from './command-palette';

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <>
      <CommandPalette />
      <div className="flex min-h-0 w-full flex-1 max-w-[100vw] overflow-x-clip bg-background">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip">
          <AppTopbar />
          <main
            className={cn(
              'min-w-0 flex-1 py-6 sm:py-8 lg:py-10',
              siteGutter,
              className,
            )}
          >
            <div className="mx-auto w-full min-w-0 max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
