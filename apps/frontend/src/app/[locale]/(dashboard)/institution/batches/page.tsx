'use client';

import type { Batch } from '@learnova/types';
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

const columns: ResourceColumn<Batch>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, exportValue: (r) => r.name },
  { id: 'year', header: 'Year', cell: (r) => r.year, exportValue: (r) => r.year },
  {
    id: 'programId',
    header: 'Program ID',
    cell: (r) => <span className="font-mono text-xs">{r.programId}</span>,
    exportValue: (r) => r.programId,
  },
];

export default function BatchesPage() {
  const { data: programsData } = usePrograms({ limit: 100 });
  const programOptions =
    programsData?.items.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })) ?? [];

  const fields: FormField[] = [
    {
      name: 'programId',
      label: 'Program',
      type: 'select',
      required: true,
      options: programOptions.length
        ? programOptions
        : [{ value: '', label: 'No programs available' }],
    },
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'year',
      label: 'Year',
      type: 'number',
      required: true,
      min: 1990,
      max: 2100,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ];

  return (
    <ResourceCrudPage<Batch>
      title="Batches"
      description="Student cohorts by program and intake year."
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
