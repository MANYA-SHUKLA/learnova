'use client';

import { useTranslations } from 'next-intl';
import { FacultyForm } from '@/features/faculty/components/faculty-form';

export default function CreateFacultyPage() {
  const t = useTranslations('dashboard.institution.faculty.create');
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
      </div>
      <FacultyForm mode="create" />
    </div>
  );
}
