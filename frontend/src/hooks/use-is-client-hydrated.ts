import { useSyncExternalStore } from 'react';

/** False during SSR and the hydration pass; true after the client has hydrated. */
export function useIsClientHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
