'use client';

import { useAuth } from '@/providers/auth-provider';

/** Defer authenticated API queries until auth hydration finishes (layout gates still mount hidden children). */
export function useSessionQueryEnabled(enabled = true): boolean {
  const { isAuthenticated, isLoading } = useAuth();
  return enabled && !isLoading && isAuthenticated;
}
