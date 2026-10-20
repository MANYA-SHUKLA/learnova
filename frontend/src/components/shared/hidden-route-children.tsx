import type { ReactNode } from 'react';

/**
 * Keeps the page segment in the React tree while a layout gate shows loading UI.
 * Omitting `{children}` during auth checks causes SSR/client hydration mismatches.
 */
export function HiddenRouteChildren({ children }: { children: ReactNode }) {
  return (
    <div className="hidden" aria-hidden inert suppressHydrationWarning>
      {children}
    </div>
  );
}
