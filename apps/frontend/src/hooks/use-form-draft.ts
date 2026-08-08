'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback';

interface UseFormDraftOptions {
  key: string;
  enabled?: boolean;
  debounceMs?: number;
}

export function useFormDraft<T extends Record<string, unknown>>(
  initial: T,
  { key, enabled = true, debounceMs = 600 }: UseFormDraftOptions,
) {
  const storageKey = `learnova:draft:${key}`;
  const [data, setDataState] = useState<T>(initial);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!enabled || hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<T>;
        setDataState((prev) => ({ ...prev, ...parsed }));
        setHasDraft(true);
      }
    } catch {
      // ignore corrupt drafts
    }
  }, [enabled, storageKey]);

  const persist = useDebouncedCallback((value: T) => {
    if (!enabled) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
      setLastSavedAt(new Date());
      setHasDraft(true);
    } catch {
      // ignore quota errors
    }
  }, debounceMs);

  const setData = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setDataState((prev) => {
        const next = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setLastSavedAt(null);
    setHasDraft(false);
  }, [storageKey]);

  return { data, setData, clearDraft, lastSavedAt, hasDraft };
}
