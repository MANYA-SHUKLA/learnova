'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type AuthPageFeedbackContextValue = {
  errorMessage: string | null;
  showError: (message: string) => void;
  clear: () => void;
};

const AuthPageFeedbackContext = createContext<AuthPageFeedbackContextValue | null>(null);

const ERROR_DISMISS_MS = 8000;

export function AuthPageFeedbackProvider({ children }: { children: ReactNode }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clear = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
  }, []);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = window.setTimeout(clear, ERROR_DISMISS_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [errorMessage, clear]);

  const value = useMemo(
    () => ({ errorMessage, showError, clear }),
    [errorMessage, showError, clear],
  );

  return (
    <AuthPageFeedbackContext.Provider value={value}>
      {children}
      {mounted ? createPortal(<AuthPageFeedbackToast />, document.body) : null}
    </AuthPageFeedbackContext.Provider>
  );
}

function AuthPageFeedbackToast() {
  const ctx = useContext(AuthPageFeedbackContext);
  const message = ctx?.errorMessage;

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          key={message}
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            'fixed z-[200] flex w-[min(calc(100vw-1.5rem),22rem)] items-start gap-2.5 rounded-xl border border-danger/40',
            'bg-background px-3.5 py-3 shadow-soft-lg ring-1 ring-danger/15',
            'right-3 top-3 sm:right-6 sm:top-5',
          )}
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-danger">{message}</p>
          <button
            type="button"
            className="shrink-0 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={() => {
              ctx?.clear();
            }}
          >
            Dismiss
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function useAuthPageFeedback(): Pick<
  AuthPageFeedbackContextValue,
  'showError' | 'clear'
> {
  const ctx = useContext(AuthPageFeedbackContext);
  if (!ctx) {
    throw new Error('useAuthPageFeedback must be used within AuthPageFeedbackProvider');
  }
  return { showError: ctx.showError, clear: ctx.clear };
}
