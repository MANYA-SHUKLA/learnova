'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Spinner,
} from '@learnova/ui';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { ApiClientError } from '@/lib/api/client';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
  useForgotPasswordMutation,
} from '@/features/auth';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const mutation = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const emailRegister = register('email');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values) => {
      setSuccessMessage(null);
      try {
        const result = await mutation.mutateAsync(values);
        setSuccessMessage(result.message);
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : t('errorMessage');
        setError('root', { message });
      }
    })(event);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100svh-9rem)] w-full max-w-md items-center justify-center py-8">
      <motion.div
        className="relative w-full"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        {/* Soft ambient orb behind the card */}
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
            )}
          >
            {/* Top accent line that expands on card hover */}
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
                <KeyRound className="size-6" strokeWidth={1.75} />
              </motion.div>
              <div className="space-y-1.5">
                <CardTitle className="font-display text-2xl tracking-tight">
                  {t('title')}
                </CardTitle>
                <CardDescription className="mx-auto max-w-sm text-sm leading-relaxed">
                  {t('description')}
                </CardDescription>
              </div>
            </CardHeader>

            <form onSubmit={onSubmit} noValidate>
              <CardContent className="space-y-4 px-6 pb-2 pt-4 sm:px-8">
                {errors.root?.message ? (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
                  >
                    {errors.root.message}
                  </motion.p>
                ) : null}
                {successMessage ? (
                  <motion.p
                    role="status"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
                  >
                    {successMessage}
                  </motion.p>
                ) : null}

                <div className="space-y-2 text-left">
                  <label htmlFor="email" className="text-sm font-medium">
                    {t('email')}
                  </label>
                  <div
                    className={cn(
                      'relative rounded-xl transition-shadow duration-300',
                      focused && 'shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]',
                    )}
                  >
                    <Mail
                      className={cn(
                        'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 transition-colors duration-200',
                        focused ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder={t('emailPlaceholder')}
                      disabled={mutation.isPending}
                      className="h-11 rounded-xl border-border/80 pl-10 transition-[border-color,background-color] duration-200 hover:border-primary/40 focus-visible:border-primary"
                      {...emailRegister}
                      onFocus={(e) => {
                        setFocused(true);
                        emailRegister.onFocus?.(e);
                      }}
                      onBlur={(e) => {
                        setFocused(false);
                        emailRegister.onBlur?.(e);
                      }}
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-xs text-danger">{errors.email.message}</p>
                  ) : null}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 px-6 pb-8 pt-2 sm:px-8">
                <motion.div
                  className="w-full"
                  whileHover={{ scale: mutation.isPending ? 1 : 1.015 }}
                  whileTap={{ scale: mutation.isPending ? 1 : 0.985 }}
                >
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-xl text-sm font-semibold transition-shadow duration-300 hover:shadow-soft-md"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <>
                        <Spinner size="sm" />
                        {t('sending')}
                      </>
                    ) : (
                      t('sendButton')
                    )}
                  </Button>
                </motion.div>

                <Link
                  href="/login"
                  className="group/back inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5 transition-transform duration-200 group-hover/back:-translate-x-1" />
                  {t('backToSignIn')}
                </Link>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
