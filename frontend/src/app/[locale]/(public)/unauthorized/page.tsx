import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { Link } from '@/lib/i18n/routing';

interface UnauthorizedPageProps {
  params: Promise<{ locale: string }>;
}

export default async function UnauthorizedPage({ params }: UnauthorizedPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('errors.unauthorized');

  return (
    <main className="flex w-full min-w-0 flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('body')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/dashboard">{t('cta')}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
