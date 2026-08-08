'use client';

import type { AcademicYear } from '@learnova/types';
import { Badge } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import {
  ResourceCrudPage,
  useAcademicYears,
  useArchiveAcademicYearMutation,
  useCreateAcademicYearMutation,
  useRestoreAcademicYearMutation,
  useUpdateAcademicYearMutation,
  type FormField,
  type ResourceColumn,
} from '@/features/institution';

function toDateInput(value: string) {
  return value.slice(0, 10);
}

export default function AcademicYearsPage() {
  const t = useTranslations('dashboard.institution.academicYears');
  const tf = useTranslations('dashboard.institution.fields');
  const ts = useTranslations('dashboard.institution.status');

  const columns: ResourceColumn<AcademicYear>[] = [
    { id: 'name', header: tf('name'), cell: (r) => r.name, exportValue: (r) => r.name },
    {
      id: 'startDate',
      header: tf('start'),
      cell: (r) => toDateInput(r.startDate),
      exportValue: (r) => r.startDate,
    },
    {
      id: 'endDate',
      header: tf('end'),
      cell: (r) => toDateInput(r.endDate),
      exportValue: (r) => r.endDate,
    },
    {
      id: 'isActive',
      header: tf('isActive'),
      cell: (r) =>
        r.isActive ? (
          <Badge variant="success">{tf('current')}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      exportValue: (r) => r.isActive,
    },
  ];

  const fields: FormField[] = [
    { name: 'name', label: tf('name'), type: 'text', required: true, placeholder: '2025-26' },
    { name: 'startDate', label: tf('startDate'), type: 'date', required: true },
    { name: 'endDate', label: tf('endDate'), type: 'date', required: true },
    { name: 'isActive', label: tf('markActiveYear'), type: 'checkbox' },
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
    <ResourceCrudPage<AcademicYear>
      title={t('title')}
      singularLabel={t('singular')}
      description={t('description')}
      exportFilename="academic-years"
      columns={columns}
      fields={fields}
      listQuery={useAcademicYears}
      createMutation={useCreateAcademicYearMutation}
      updateMutation={useUpdateAcademicYearMutation}
      archiveMutation={useArchiveAcademicYearMutation}
      restoreMutation={useRestoreAcademicYearMutation}
      getEditValues={(row) => ({
        name: row.name,
        startDate: toDateInput(row.startDate),
        endDate: toDateInput(row.endDate),
        isActive: row.isActive,
        status: row.status === 'archived' ? 'active' : row.status,
      })}
    />
  );
}
