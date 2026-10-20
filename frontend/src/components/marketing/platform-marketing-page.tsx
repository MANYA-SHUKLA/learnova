'use client';

import { Button, Input } from '@learnova/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { publicApi } from '@/features/public/services/public-api';
import { siteContainer } from '@/lib/layout';
import { ctaButtonClass } from '@/lib/cta';
import { ApiClientError } from '@/lib/api/client';
import { Link } from '@/lib/i18n/routing';

export function PlatformMarketingPage() {
  const { data: marketing, isLoading } = useQuery({
    queryKey: ['public', 'platform-marketing'],
    queryFn: () => publicApi.getPlatformMarketing(),
  });

  const [form, setForm] = useState({
    institutionName: '',
    contactName: '',
    contactEmail: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const demoMutation = useMutation({
    mutationFn: () => publicApi.createDemoRequest(form),
    onSuccess: () => setSubmitted(true),
  });

  if (isLoading || !marketing) {
    return <div className={siteContainer('py-24 text-center text-muted-foreground')}>Loading…</div>;
  }

  return (
    <main className="font-body">
      <section className="bg-hero py-20">
        <div className={siteContainer('max-w-3xl text-center')}>
          <h1 className="font-display text-4xl font-bold tracking-tight">{marketing.heroTitle}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{marketing.heroSubtitle}</p>
          <Button asChild size="lg" className={`mt-8 ${ctaButtonClass}`}>
            <a href="#request-demo">{marketing.heroCtaLabel ?? 'Request a demo'}</a>
          </Button>
        </div>
      </section>

      <section className={siteContainer('py-16')}>
        <div className="grid gap-6 md:grid-cols-3">
          {marketing.features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft-md">
              <h2 className="font-display text-lg font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {marketing.pricingBody ? (
        <section className="border-y border-border bg-muted/30 py-16">
          <div className={siteContainer('max-w-3xl')}>
            <h2 className="font-display text-2xl font-bold">{marketing.pricingTitle ?? 'Pricing'}</h2>
            <p className="mt-4 whitespace-pre-wrap text-muted-foreground">{marketing.pricingBody}</p>
          </div>
        </section>
      ) : null}

      <section id="request-demo" className={siteContainer('py-16')}>
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 shadow-soft-md">
          <h2 className="font-display text-2xl font-bold">Request a demo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us about your college. We will confirm a meeting by email — no payment on this site.
          </p>
          {submitted ? (
            <p className="mt-6 text-sm font-medium text-primary">Thank you — we received your request.</p>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void demoMutation.mutateAsync();
              }}
            >
              <Input
                placeholder="Institution name"
                value={form.institutionName}
                onChange={(e) => setForm((f) => ({ ...f, institutionName: e.target.value }))}
                required
              />
              <Input
                placeholder="Contact name"
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                required
              />
              <Input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
              />
              <textarea
                className="flex min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                placeholder="Message (optional)"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
              {demoMutation.error instanceof ApiClientError ? (
                <p className="text-sm text-destructive">{demoMutation.error.message}</p>
              ) : null}
              <Button type="submit" className={ctaButtonClass} disabled={demoMutation.isPending}>
                {demoMutation.isPending ? 'Sending…' : 'Submit request'}
              </Button>
            </form>
          )}
        </div>
      </section>

      {marketing.faq.length > 0 ? (
        <section className={siteContainer('pb-20')}>
          <h2 className="font-display text-2xl font-bold">FAQ</h2>
          <div className="mt-6 space-y-4">
            {marketing.faq.map((item) => (
              <div key={item.title} className="rounded-xl border border-border p-5">
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        {marketing.footerNote ?? 'Learnova platform'} ·{' '}
        <Link href="/" className="text-primary hover:underline">
          Campus portals
        </Link>
      </footer>
    </main>
  );
}
