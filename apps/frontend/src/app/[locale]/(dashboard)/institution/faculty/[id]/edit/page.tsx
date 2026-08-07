'use client';

import { Skeleton } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { FacultyForm } from '@/features/faculty/components/faculty-form';
import { useFaculty } from '@/features/faculty';
import { ErrorState } from '@/features/institution';

export default function EditFacultyPage() {
  const t = useTranslations('dashboard.institution.faculty.edit');
  const params = useParams<{ id: string }>();
  const query = useFaculty(params.id);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        message={query.error instanceof Error ? query.error.message : t('notFound')}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          {t('title', { name: query.data.fullName })}
        </h1>
      </div>
      <FacultyForm mode="edit" initial={query.data} />
    </div>
  );
}
