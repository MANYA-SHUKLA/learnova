import { APP_ROUTES } from '@learnova/constants';
import { Button } from '@learnova/ui';
import { setRequestLocale } from 'next-intl/server';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { ctaButtonClass } from '@/lib/cta';
import { siteContainer } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main className="w-full font-body">
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,_hsl(var(--primary)/0.14),_transparent_55%)]"
          />
          <div className={siteContainer('relative pb-16 pt-20 text-center sm:pb-20 sm:pt-24')}>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Contact
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Talk to Learnova
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Ask about institutional rollout, or reach the team behind this project.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className={ctaButtonClass}>
                <Link href={APP_ROUTES.LOGIN}>Institution Login</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className={siteContainer()}>
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Mail,
                  title: 'Email',
                  body: 'shuklamanya99@gmail.com',
                  href: 'mailto:shuklamanya99@gmail.com',
                  external: true,
                },
                {
                  icon: Phone,
                  title: 'WhatsApp',
                  body: 'Chat with Manya Shukla',
                  href: 'https://wa.me/918005586588',
                  external: true,
                },
                {
                  icon: MessageSquare,
                  title: 'Onboarding',
                  body: 'Sign in to your institution workspace',
                  href: APP_ROUTES.LOGIN,
                  external: false,
                },
              ].map(({ icon: Icon, title, body, href, external }) =>
                external ? (
                  <a
                    key={title}
                    href={href}
                    className="card-interactive block rounded-2xl border border-border bg-card p-6 shadow-soft-sm"
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h2 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                  </a>
                ) : (
                  <Link
                    key={title}
                    href={href}
                    className="card-interactive block rounded-2xl border border-border bg-card p-6 shadow-soft-sm"
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h2 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
