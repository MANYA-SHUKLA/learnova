/**
 * Debounced callback hook
 */

import { useCallback, useRef } from 'react';

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: never[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay],
  );
}
