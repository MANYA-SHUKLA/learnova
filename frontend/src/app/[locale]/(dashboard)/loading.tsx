'use client';

import { Spinner } from '@learnova/ui';

/** In-content loader only — session chrome lives in `(dashboard)/layout.tsx`. */
export default function DashboardRouteLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
