'use client';

import type { School } from '@learnova/types';
import { useTranslations } from 'next-intl';
import {
  ResourceCrudPage,
  useArchiveSchoolMutation,
  useCreateSchoolMutation,
  useRestoreSchoolMutation,
  useSchools,
  useUpdateSchoolMutation,
  type FormField,
  type ResourceColumn,
} from '@/features/institution';

export default function SchoolsPage() {
  const t = useTranslations('dashboard.institution.schools');
  const tf = useTranslations('dashboard.institution.fields');
  const ts = useTranslations('dashboard.institution.status');

  const columns: ResourceColumn<School>[] = [
    { id: 'name', header: tf('name'), cell: (r) => r.name, exportValue: (r) => r.name },
    { id: 'code', header: tf('code'), cell: (r) => r.code, exportValue: (r) => r.code },
    {
      id: 'description',
      header: tf('description'),
      cell: (r) => r.description ?? '—',
      exportValue: (r) => r.description,
    },
  ];

  const fields: FormField[] = [
    { name: 'name', label: tf('name'), type: 'text', required: true },
    { name: 'code', label: tf('code'), type: 'text', required: true },
    { name: 'description', label: tf('description'), type: 'textarea' },
    {
      name: 'status',
      label: tf('status'),
      type: 'select',
      options: [
        { value: 'active', label: ts('active') },
        { value: 'inactive', label: ts('inactive') },
      ],
    },
  ];

  return (
    <ResourceCrudPage<School>
      title={t('title')}
      singularLabel={t('singular')}
      description={t('description')}
      exportFilename="schools"
      columns={columns}
      fields={fields}
      listQuery={useSchools}
      createMutation={useCreateSchoolMutation}
      updateMutation={useUpdateSchoolMutation}
      archiveMutation={useArchiveSchoolMutation}
      restoreMutation={useRestoreSchoolMutation}
      getEditValues={(row) => ({
        name: row.name,
        code: row.code,
        description: row.description ?? '',
        status: row.status === 'archived' ? 'active' : row.status,
      })}
    />
  );
}
