import { SessionLoadingShell } from '@/components/shared/session-loading-shell';

/** Matches `(dashboard)/layout.tsx` shell so route loading and auth gate hydrate the same. */
export default function DashboardRouteLoading() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SessionLoadingShell />
    </div>
  );
}
