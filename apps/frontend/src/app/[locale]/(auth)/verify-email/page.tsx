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
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ApiClientError } from '@/lib/api/client';
import { Link } from '@/lib/i18n/routing';
import { useVerifyEmailMutation } from '@/features/auth';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const mutation = useVerifyEmailMutation();
  const started = useRef(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  );
  const [message, setMessage] = useState(
    token ? 'Verifying your email…' : 'Verification token is missing.',
  );

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    void (async () => {
      try {
        const result = await mutation.mutateAsync({ token });
        setStatus('success');
        setMessage(result.message || 'Email verified successfully.');
      } catch (err) {
        setStatus('error');
        setMessage(
          err instanceof ApiClientError
            ? err.message
            : 'Unable to verify email. The link may be expired.',
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount with token
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify email</CardTitle>
          <CardDescription>
            {status === 'loading'
              ? 'Confirming your email address.'
              : status === 'success'
                ? 'Your account is ready.'
                : 'We could not verify this link.'}
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
            <Link href="/login">Go to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
