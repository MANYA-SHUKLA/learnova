'use client';

import { DashboardRouteShell } from '@/components/shared/dashboard-route-shell';

/** Matches `(dashboard)/layout.tsx` outer shell while the page segment streams in. */
export default function DashboardRouteLoading() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DashboardRouteShell message="Loading your session…" />
    </div>
  );
}
