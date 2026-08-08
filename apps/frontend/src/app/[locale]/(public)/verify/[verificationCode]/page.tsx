'use client';

import { Badge, Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { useVerifyCertificateQuery } from '@/features/certificate';
import { siteContainer } from '@/lib/layout';

export default function VerifyCertificatePage() {
  const t = useTranslations('marketing.verify');
  const params = useParams<{ verificationCode: string }>();
  const code = decodeURIComponent(params.verificationCode ?? '');
  const verifyQuery = useVerifyCertificateQuery(code, code.length >= 8);
  const result = verifyQuery.data;
  const empty = t('empty');

  return (
    <>
      <SiteHeader />
      <main className="relative w-full flex-1 font-body">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,_hsl(var(--primary)/0.16),_transparent_55%),radial-gradient(ellipse_40%_30%_at_85%_15%,_hsl(var(--accent)/0.12),_transparent_50%)]"
        />
        <div className={siteContainer('relative flex min-h-[calc(100vh-8rem)] flex-col justify-center py-16 sm:py-20')}>
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft-sm">
                <ShieldCheck className="size-7" />
              </div>
              <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {t('title')}
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
                {t('description')}
              </p>
            </div>

            {verifyQuery.isLoading ? (
              <Skeleton className="h-56 rounded-2xl" />
            ) : (
              <Card className="rounded-2xl border-border/80 bg-card/95 shadow-soft-md backdrop-blur-sm">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg">{t('resultTitle')}</CardTitle>
                    <Badge variant={result?.valid ? 'default' : 'danger'}>
                      {result?.valid ? t('valid') : t('invalid')}
                    </Badge>
                  </div>
                  <CardDescription>{String(result?.message ?? '')}</CardDescription>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    {[
                      [t('institution'), result?.institutionName],
                      [t('student'), result?.studentName],
                      [t('document'), result?.title],
                      [t('certificateNumber'), result?.certificateNumber],
                      [t('status'), result?.status],
                      [t('issued'), result?.issuedAt],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium">{String(value ?? empty)}</dd>
                      </div>
                    ))}
                  </dl>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
