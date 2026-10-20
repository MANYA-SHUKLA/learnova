'use client';

import { DashboardRouteShell } from '@/components/shared/dashboard-route-shell';

/** Same tree as `(dashboard)/layout.tsx` while auth resolves — avoids Suspense vs layout hydration drift. */
export default function DashboardRouteLoading() {
  return <DashboardRouteShell message="Loading your session…" />;
}
