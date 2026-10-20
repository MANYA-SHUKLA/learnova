import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Button } from '@learnova/ui';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { siteContainer } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';
import { env } from '@/config/env';
import { campusPublicPath, isReservedCampusSlug } from '@/lib/campus-slugs';

async function fetchPortal(slug: string) {
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  const res = await fetch(`${base}/public/portal?slug=${encodeURIComponent(slug)}`, {
    next: { revalidate: 120 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: { name: string; slug: string } };
  return json.data;
}

const MODULES = [
  'Academic structure (programs, sections, batches)',
  'Faculty and student records',
  'Courses, enrollments, and timetables',
  'Assignments, quizzes, and examinations',
  'Gradebook, certificates, and reports',
  'Notifications and institution settings',
];

interface GuidePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function CampusGuideBySlugPage({ params }: GuidePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (isReservedCampusSlug(slug)) notFound();

  const portal = await fetchPortal(slug);
  if (!portal) notFound();

  return (
    <>
      <SiteHeader campusPortal />
      <main className={siteContainer('py-16')}>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Campus admin guide</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{portal.name}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          After you receive admin credentials, sign in to configure branding, portal copy, and invite faculty
          and students.
        </p>
        <ul className="mt-8 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {MODULES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/login?campus=${encodeURIComponent(portal.slug)}`}>Admin sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={campusPublicPath(portal.slug)}>View public portal</Link>
          </Button>
        </div>
      </main>
      <SiteFooter campusPortal campusName={portal.name} />
    </>
  );
}
