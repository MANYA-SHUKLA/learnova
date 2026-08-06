import { setRequestLocale } from 'next-intl/server';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { Link } from '@/lib/i18n/routing';

interface ForbiddenPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ForbiddenPage({ params }: ForbiddenPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex min-h-svh w-full min-w-0 items-center justify-center px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forbidden</CardTitle>
          <CardDescription>You do not have permission to view this page.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Contact your institution administrator if you believe this is a mistake.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
