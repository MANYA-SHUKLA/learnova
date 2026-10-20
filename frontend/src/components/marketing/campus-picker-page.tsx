'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { publicApi } from '@/features/public/services/public-api';
import { siteContainer } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';

export function CampusPickerPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['public', 'institutions'],
    queryFn: () => publicApi.listInstitutions(),
  });

  return (
    <main className={siteContainer('py-20')}>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold">Choose your campus</h1>
        <p className="mt-3 text-muted-foreground">
          Select your institution to open the official academic portal.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
        {isLoading ? (
          <p className="col-span-full text-center text-muted-foreground">Loading campuses…</p>
        ) : (
          data?.items.map((campus) => (
            <Link
              key={campus.slug}
              href={`/campus/${campus.slug}`}
              className="card-interactive flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft-md"
            >
              {campus.logo ? (
                <Image src={campus.logo} alt="" width={48} height={48} className="size-12 rounded-lg object-contain" />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {campus.shortName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="font-semibold">{campus.name}</p>
                <p className="text-sm text-muted-foreground">Open portal</p>
              </div>
            </Link>
          ))
        )}
      </div>
      <p className="mt-12 text-center text-sm text-muted-foreground">
        Buying Learnova for your college?{' '}
        <Link href="/platform" className="font-medium text-primary hover:underline">
          About the platform
        </Link>
      </p>
    </main>
  );
}
