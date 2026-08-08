'use client';

import { useTranslations } from 'next-intl';
import { StudentForm } from '@/features/student/components/student-form';

export default function CreateStudentPage() {
  const t = useTranslations('dashboard.institution.students.create');
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
      </div>
      <StudentForm mode="create" />
    </div>
  );
}
