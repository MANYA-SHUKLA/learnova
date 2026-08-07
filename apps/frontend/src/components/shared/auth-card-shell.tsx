'use client';

/**
 * Shared auth card shell — same visual language as forgot-password:
 * centered, spring entrance, hover lift, ambient orb, accent line.
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@learnova/ui';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AuthCardShell({
  icon: Icon,
  title,
  description,
  children,
  footer,
  maxWidthClass = 'max-w-md',
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto flex min-h-[calc(100svh-9rem)] w-full items-center justify-center py-8',
        maxWidthClass,
      )}
    >
      <motion.div
        className="relative w-full"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -top-16 -z-10 h-40 rounded-full bg-primary/15 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.7 }}
        />

        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className="group relative"
        >
          <Card
            className={cn(
              'relative w-full overflow-hidden rounded-2xl border-border/80 bg-card/95 shadow-soft-lg backdrop-blur-sm',
              'transition-[border-color,box-shadow] duration-300',
              'group-hover:border-primary/35 group-hover:shadow-soft-lg',
              className,
            )}
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[2px] origin-center scale-x-[0.28] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 transition-all duration-500 group-hover:scale-x-100 group-hover:opacity-100"
            />

            <CardHeader className="space-y-4 pb-2 pt-8 text-center">
              <motion.div
                className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                whileHover={{ rotate: [-2, 2, 0], scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 400, damping: 14 }}
              >
                <Icon className="size-6" strokeWidth={1.75} />
              </motion.div>
              <div className="space-y-1.5">
                <CardTitle className="font-display text-2xl tracking-tight">{title}</CardTitle>
                {description ? (
                  <CardDescription className="mx-auto max-w-sm text-sm leading-relaxed">
                    {description}
                  </CardDescription>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6 pb-2 pt-4 text-left sm:px-8">
              {children}
            </CardContent>

            {footer ? (
              <CardFooter className="flex flex-col gap-4 px-6 pb-8 pt-2 sm:px-8">
                {footer}
              </CardFooter>
            ) : null}
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function AuthSubmitButton({
  pending,
  pendingLabel,
  label,
}: {
  pending: boolean;
  pendingLabel: string;
  label: string;
}) {
  return (
    <motion.div
      className="w-full"
      whileHover={{ scale: pending ? 1 : 1.015 }}
      whileTap={{ scale: pending ? 1 : 0.985 }}
    >
      {/* Button is passed via children pattern from pages — see AuthPrimaryButton */}
      <span className="sr-only">{pending ? pendingLabel : label}</span>
    </motion.div>
  );
}

export function AuthAlert({
  variant,
  children,
}: {
  variant: 'error' | 'success';
  children: ReactNode;
}) {
  return (
    <motion.p
      role={variant === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border px-3 py-2 text-sm',
        variant === 'error'
          ? 'border-danger/30 bg-danger/10 text-danger'
          : 'border-success/30 bg-success/10 text-success',
      )}
    >
      {children}
    </motion.p>
  );
}

export const authInputClassName =
  'h-11 rounded-xl border-border/80 transition-[border-color,background-color] duration-200 hover:border-primary/40 focus-visible:border-primary';

export const authPrimaryButtonClassName =
  'h-11 w-full rounded-xl text-sm font-semibold transition-shadow duration-300 hover:shadow-soft-md';
