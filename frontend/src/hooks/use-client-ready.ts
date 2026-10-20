'use client';

import { useSyncExternalStore } from 'react';

/** False on the server and during hydration; true after the client has mounted. */
export function useClientReady(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
