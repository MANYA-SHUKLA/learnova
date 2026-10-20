'use client';

import { Button } from '@learnova/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type SuccessPopupPlacement = 'top-center' | 'top-right';

interface SuccessPopupProps {
  open: boolean;
  message: string;
  onClose: () => void;
  dismissLabel?: string;
  durationMs?: number;
  className?: string;
  /** Toast position — default top-center; use top-right for console / mail feedback */
  placement?: SuccessPopupPlacement;
}

export function SuccessPopup({
  open,
  message,
  onClose,
  dismissLabel = 'Dismiss',
  durationMs = 3500,
  className,
  placement = 'top-center',
}: SuccessPopupProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => { window.clearTimeout(timer); };
  }, [open, onClose, durationMs]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={cn(
            'fixed top-4 z-[100] flex w-[min(calc(100vw-2rem),22rem)] items-start gap-3 rounded-xl border border-success/30 bg-background/95 p-3.5 shadow-soft-lg backdrop-blur-sm sm:top-6',
            placement === 'top-right'
              ? 'right-4 sm:right-6'
              : 'left-1/2 -translate-x-1/2',
            className,
          )}
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-medium text-foreground">{message}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label={dismissLabel}
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
