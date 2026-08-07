'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Spinner,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ApiClientError } from '@/lib/api/client';
import { Link } from '@/lib/i18n/routing';
import { useVerifyEmailMutation } from '@/features/auth';

function VerifyEmailContent() {
  const t = useTranslations('auth.verifyEmail');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const mutation = useVerifyEmailMutation();
  const started = useRef(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  );
  const [message, setMessage] = useState(
    token ? tCommon('loading') : tCommon('error'),
  );

  const mutateAsync = mutation.mutateAsync;

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    void (async () => {
      try {
        const result = await mutateAsync({ token });
        setStatus('success');
        setMessage(result.message || t('description'));
      } catch (err) {
        setStatus('error');
        setMessage(
          err instanceof ApiClientError ? err.message : tCommon('error'),
        );
      }
    })();
  }, [token, mutateAsync, t, tCommon]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {status === 'loading' ? tCommon('loading') : t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'loading' ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Spinner size="sm" />
            {message}
          </div>
        ) : (
          <p
            role={status === 'error' ? 'alert' : 'status'}
            className={
              status === 'success'
                ? 'rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success'
                : 'rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger'
            }
          >
            {message}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" disabled={status === 'loading'}>
          <Link href="/login">{t('backToLogin')}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function VerifyFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex min-h-[200px] items-center justify-center pt-6">
        <Spinner size="lg" />
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="w-full min-w-0">
      <Suspense fallback={<VerifyFallback />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
