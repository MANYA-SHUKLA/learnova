'use client';

import { Spinner } from '@learnova/ui';
import type { ReactNode } from 'react';
import { HiddenRouteChildren } from './hidden-route-children';

/** Role-scoped layout gate — always preserves `{children}` for Next.js hydration. */
export function RoleRouteLoading({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-[40vh] flex-1 flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
      </div>
      <HiddenRouteChildren>{children}</HiddenRouteChildren>
    </>
  );
}
