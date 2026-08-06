import { setRequestLocale } from 'next-intl/server';

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="font-display text-3xl font-bold tracking-tight">About Learnova</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Learnova is an enterprise AI learning platform for modern institutions — LMS, ERP,
        examinations, coding, cloud IDE, ideation, analytics, and audit.
      </p>
    </main>
  );
}
