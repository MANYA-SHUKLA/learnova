'use client';

import type { Semester } from '@learnova/types';
import { useTranslations } from 'next-intl';
import {
  ResourceCrudPage,
  useAcademicYears,
  useArchiveSemesterMutation,
  useCreateSemesterMutation,
  useRestoreSemesterMutation,
  useSemesters,
  useUpdateSemesterMutation,
  type FormField,
  type ResourceColumn,
} from '@/features/institution';

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : '';
}

export default function SemestersPage() {
  const t = useTranslations('dashboard.institution.semesters');
  const tf = useTranslations('dashboard.institution.fields');
  const ts = useTranslations('dashboard.institution.status');
  const tt = useTranslations('dashboard.institution.terms');
  const { data: yearsData } = useAcademicYears({ limit: 100 });
  const yearOptions =
    yearsData?.items.map((y) => ({ value: y.id, label: y.name })) ?? [];

  const columns: ResourceColumn<Semester>[] = [
    { id: 'name', header: tf('name'), cell: (r) => r.name, exportValue: (r) => r.name },
    { id: 'number', header: tf('number'), cell: (r) => r.number, exportValue: (r) => r.number },
    { id: 'term', header: tf('term'), cell: (r) => r.term, exportValue: (r) => r.term },
    {
      id: 'academicYearId',
      header: tf('yearId'),
      cell: (r) => <span className="font-mono text-xs">{r.academicYearId}</span>,
      exportValue: (r) => r.academicYearId,
    },
  ];

  const fields: FormField[] = [
    {
      name: 'academicYearId',
      label: tf('academicYear'),
      type: 'select',
      required: true,
      options: yearOptions.length
        ? yearOptions
        : [{ value: '', label: tf('noAcademicYears') }],
    },
    { name: 'name', label: tf('name'), type: 'text', required: true },
    { name: 'number', label: tf('number'), type: 'number', required: true, min: 1, max: 20 },
    {
      name: 'term',
      label: tf('term'),
      type: 'select',
      required: true,
      options: [
        { value: 'odd', label: tt('odd') },
        { value: 'even', label: tt('even') },
        { value: 'summer', label: tt('summer') },
      ],
    },
    { name: 'startDate', label: tf('startDate'), type: 'date' },
    { name: 'endDate', label: tf('endDate'), type: 'date' },
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
    <ResourceCrudPage<Semester>
      title={t('title')}
      singularLabel={t('singular')}
      description={t('description')}
      exportFilename="semesters"
      columns={columns}
      fields={fields}
      listQuery={useSemesters}
      createMutation={useCreateSemesterMutation}
      updateMutation={useUpdateSemesterMutation}
      archiveMutation={useArchiveSemesterMutation}
      restoreMutation={useRestoreSemesterMutation}
      getEditValues={(row) => ({
        academicYearId: row.academicYearId,
        name: row.name,
        number: row.number,
        term: row.term,
        startDate: toDateInput(row.startDate),
        endDate: toDateInput(row.endDate),
        status: row.status === 'archived' ? 'active' : row.status,
      })}
    />
  );
}
