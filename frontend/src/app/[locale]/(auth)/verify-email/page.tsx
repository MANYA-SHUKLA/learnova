'use client';

import {
  Button,
  CardContent,
  CardFooter,
  Spinner,
} from '@learnova/ui';
import { MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import {
  AuthAlert,
  AuthButtonMotion,
  AuthCardShell,
  authContentClassName,
  authFooterClassName,
  authPrimaryButtonClassName,
} from '@/components/shared/auth-card-shell';
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
    <AuthCardShell
      brand="company"
      icon={MailCheck}
      title={t('title')}
      description={status === 'loading' ? tCommon('loading') : t('description')}
    >
      <CardContent className={authContentClassName}>
        {status === 'loading' ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Spinner size="sm" />
            {message}
          </div>
        ) : (
          <AuthAlert variant={status === 'success' ? 'success' : 'error'}>
            {message}
          </AuthAlert>
        )}
      </CardContent>
      <CardFooter className={authFooterClassName}>
        <AuthButtonMotion pending={status === 'loading'}>
          <Button
            asChild
            className={authPrimaryButtonClassName}
            disabled={status === 'loading'}
          >
            <Link href="/login">{t('backToLogin')}</Link>
          </Button>
        </AuthButtonMotion>
      </CardFooter>
    </AuthCardShell>
  );
}

function VerifyFallback() {
  return (
    <AuthCardShell brand="company" icon={MailCheck} title="…" description="">
      <CardContent className="flex min-h-[200px] items-center justify-center py-10">
        <Spinner size="lg" />
      </CardContent>
    </AuthCardShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
