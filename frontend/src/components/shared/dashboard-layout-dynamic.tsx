'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { DashboardRouteShell } from '@/components/shared/dashboard-route-shell';

const DashboardGroupLayoutClient = dynamic(
  () =>
    import('@/components/shared/dashboard-group-layout-client').then(
      (mod) => mod.DashboardGroupLayoutClient,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardRouteShell message="Loading your session…" />
      </div>
    ),
  },
);

export function DashboardLayoutDynamic({ children }: { children: ReactNode }) {
  return <DashboardGroupLayoutClient>{children}</DashboardGroupLayoutClient>;
}
