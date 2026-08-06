'use client';

import type { Section } from '@learnova/types';
import {
  ResourceCrudPage,
  useArchiveSectionMutation,
  useCreateSectionMutation,
  usePrograms,
  useRestoreSectionMutation,
  useSections,
  useSemesters,
  useUpdateSectionMutation,
  type FormField,
  type ResourceColumn,
} from '@/features/institution';

const columns: ResourceColumn<Section>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, exportValue: (r) => r.name },
  {
    id: 'capacity',
    header: 'Capacity',
    cell: (r) => r.capacity,
    exportValue: (r) => r.capacity,
  },
  {
    id: 'programId',
    header: 'Program ID',
    cell: (r) => <span className="font-mono text-xs">{r.programId}</span>,
    exportValue: (r) => r.programId,
  },
  {
    id: 'semesterId',
    header: 'Semester ID',
    cell: (r) => <span className="font-mono text-xs">{r.semesterId}</span>,
    exportValue: (r) => r.semesterId,
  },
];

export default function SectionsPage() {
  const { data: programsData } = usePrograms({ limit: 100 });
  const { data: semestersData } = useSemesters({ limit: 100 });

  const programOptions =
    programsData?.items.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })) ?? [];
  const semesterOptions =
    semestersData?.items.map((s) => ({ value: s.id, label: s.name })) ?? [];

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
    {
      name: 'semesterId',
      label: 'Semester',
      type: 'select',
      required: true,
      options: semesterOptions.length
        ? semesterOptions
        : [{ value: '', label: 'No semesters available' }],
    },
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'A' },
    {
      name: 'capacity',
      label: 'Capacity',
      type: 'number',
      required: true,
      min: 1,
      max: 500,
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
    <ResourceCrudPage<Section>
      title="Sections"
      description="Class sections by program and semester."
      exportFilename="sections"
      columns={columns}
      fields={fields}
      listQuery={useSections}
      createMutation={useCreateSectionMutation}
      updateMutation={useUpdateSectionMutation}
      archiveMutation={useArchiveSectionMutation}
      restoreMutation={useRestoreSectionMutation}
      getEditValues={(row) => ({
        programId: row.programId,
        semesterId: row.semesterId,
        name: row.name,
        capacity: row.capacity,
        status: row.status === 'archived' ? 'active' : row.status,
      })}
    />
  );
}
