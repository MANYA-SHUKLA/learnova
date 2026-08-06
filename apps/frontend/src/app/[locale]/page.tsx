import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@learnova/ui';
import { Link } from '@/lib/i18n/routing';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08),_transparent_55%)]"
      />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-24">
        <p className="font-display text-sm font-semibold tracking-wide text-primary">
          {t('common.appName')}
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {t('home.headline')}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t('home.subtitle')}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/login">{t('home.cta')}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">{t('common.continue')}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
