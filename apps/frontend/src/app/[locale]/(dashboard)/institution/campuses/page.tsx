'use client';

import type { Campus } from '@learnova/types';
import { useTranslations } from 'next-intl';
import {
  ResourceCrudPage,
  useArchiveCampusMutation,
  useCampuses,
  useCreateCampusMutation,
  useRestoreCampusMutation,
  useUpdateCampusMutation,
  type FormField,
  type ResourceColumn,
} from '@/features/institution';

export default function CampusesPage() {
  const t = useTranslations('dashboard.institution.campuses');
  const tf = useTranslations('dashboard.institution.fields');
  const ts = useTranslations('dashboard.institution.status');

  const columns: ResourceColumn<Campus>[] = [
    { id: 'name', header: tf('name'), cell: (r) => r.name, exportValue: (r) => r.name },
    { id: 'code', header: tf('code'), cell: (r) => r.code, exportValue: (r) => r.code },
    {
      id: 'city',
      header: tf('city'),
      cell: (r) => r.city ?? '—',
      exportValue: (r) => r.city,
    },
    {
      id: 'country',
      header: tf('country'),
      cell: (r) => r.country ?? '—',
      exportValue: (r) => r.country,
    },
  ];

  const fields: FormField[] = [
    { name: 'name', label: tf('name'), type: 'text', required: true },
    { name: 'code', label: tf('code'), type: 'text', required: true },
    { name: 'address', label: tf('address'), type: 'text' },
    { name: 'city', label: tf('city'), type: 'text' },
    { name: 'state', label: tf('state'), type: 'text' },
    { name: 'country', label: tf('country'), type: 'text' },
    { name: 'phone', label: tf('phone'), type: 'text', placeholder: '8005586588' },
    {
      name: 'email',
      label: tf('email'),
      type: 'email',
      placeholder: 'shuklamanya99@gmail.com',
    },
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
    <ResourceCrudPage<Campus>
      title={t('title')}
      singularLabel={t('singular')}
      description={t('description')}
      exportFilename="campuses"
      columns={columns}
      fields={fields}
      listQuery={useCampuses}
      createMutation={useCreateCampusMutation}
      updateMutation={useUpdateCampusMutation}
      archiveMutation={useArchiveCampusMutation}
      restoreMutation={useRestoreCampusMutation}
      getEditValues={(row) => ({
        name: row.name,
        code: row.code,
        address: row.address ?? '',
        city: row.city ?? '',
        state: row.state ?? '',
        country: row.country ?? '',
        phone: row.phone ?? '',
        email: row.email ?? '',
        status: row.status === 'archived' ? 'active' : row.status,
      })}
    />
  );
}
