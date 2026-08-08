'use client';

import type { Batch } from '@learnova/types';
import { useTranslations } from 'next-intl';
import {
  ResourceCrudPage,
  useArchiveBatchMutation,
  useBatches,
  useCreateBatchMutation,
  usePrograms,
  useRestoreBatchMutation,
  useUpdateBatchMutation,
  type FormField,
  type ResourceColumn,
} from '@/features/institution';

export default function BatchesPage() {
  const t = useTranslations('dashboard.institution.batches');
  const tf = useTranslations('dashboard.institution.fields');
  const ts = useTranslations('dashboard.institution.status');
  const { data: programsData } = usePrograms({ limit: 100 });
  const programOptions =
    programsData?.items.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })) ?? [];

  const columns: ResourceColumn<Batch>[] = [
    { id: 'name', header: tf('name'), cell: (r) => r.name, exportValue: (r) => r.name },
    { id: 'year', header: tf('year'), cell: (r) => r.year, exportValue: (r) => r.year },
    {
      id: 'programId',
      header: tf('programId'),
      cell: (r) => <span className="font-mono text-xs">{r.programId}</span>,
      exportValue: (r) => r.programId,
    },
  ];

  const fields: FormField[] = [
    {
      name: 'programId',
      label: tf('program'),
      type: 'select',
      required: true,
      options: programOptions.length
        ? programOptions
        : [{ value: '', label: tf('noPrograms') }],
    },
    { name: 'name', label: tf('name'), type: 'text', required: true },
    {
      name: 'year',
      label: tf('year'),
      type: 'number',
      required: true,
      min: 1990,
      max: 2100,
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
    <ResourceCrudPage<Batch>
      title={t('title')}
      singularLabel={t('singular')}
      description={t('description')}
      exportFilename="batches"
      columns={columns}
      fields={fields}
      listQuery={useBatches}
      createMutation={useCreateBatchMutation}
      updateMutation={useUpdateBatchMutation}
      archiveMutation={useArchiveBatchMutation}
      restoreMutation={useRestoreBatchMutation}
      getEditValues={(row) => ({
        programId: row.programId,
        name: row.name,
        year: row.year,
        status: row.status === 'archived' ? 'active' : row.status,
      })}
    />
  );
}
