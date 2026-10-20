import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { InstitutionLoginForm } from '@/components/auth/institution-login-form';
import { fetchPublicPortal } from '@/lib/campus-portal';
import { isReservedCampusSlug } from '@/lib/campus-slugs';
import { siteGutter } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

interface CampusLoginPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function CampusLoginPage({ params }: CampusLoginPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (isReservedCampusSlug(slug)) notFound();

  const portal = await fetchPublicPortal(slug);
  if (!portal) notFound();

  const supportEmail = portal.portalSettings?.supportEmail;
  const showPlatform = portal.portalSettings?.showPlatformLink !== false;

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-hero" aria-hidden />
      <header className={cn('relative z-50 flex items-center justify-between py-5', siteGutter)}>
        <Link
          href={`/${portal.slug}/login`}
          className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl"
        >
          {portal.shortName || portal.name}
        </Link>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>
      <main
        className={cn(
          'relative z-10 flex w-full flex-1 items-center justify-center pb-10 pt-4',
          siteGutter,
        )}
      >
        <InstitutionLoginForm campusSlug={portal.slug} portal={portal} />
      </main>
      <footer className={cn('relative z-10 border-t border-border/60 py-6 text-center text-xs', siteGutter)}>
        <p className="text-muted-foreground">
          {portal.portalSettings?.officialCredit ??
            `Official academic portal · ${portal.name}`}
        </p>
        {supportEmail?.includes('@') ? (
          <p className="mt-2 text-muted-foreground">
            <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
              {supportEmail}
            </a>
          </p>
        ) : null}
        {showPlatform ? (
          <p className="mt-3">
            <Link href="/" className="text-primary hover:underline">
              Learnova platform
            </Link>
          </p>
        ) : null}
      </footer>
    </div>
  );
}
