'use client';

import type { Program } from '@learnova/types';
import {
  ResourceCrudPage,
  useArchiveProgramMutation,
  useCreateProgramMutation,
  useDepartments,
  usePrograms,
  useRestoreProgramMutation,
  useUpdateProgramMutation,
  type FormField,
  type ResourceColumn,
} from '@/features/institution';

const columns: ResourceColumn<Program>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, exportValue: (r) => r.name },
  { id: 'code', header: 'Code', cell: (r) => r.code, exportValue: (r) => r.code },
  { id: 'level', header: 'Level', cell: (r) => r.level, exportValue: (r) => r.level },
  {
    id: 'duration',
    header: 'Years',
    cell: (r) => r.durationYears,
    exportValue: (r) => r.durationYears,
  },
  {
    id: 'credits',
    header: 'Credits',
    cell: (r) => r.credits,
    exportValue: (r) => r.credits,
  },
];

export default function ProgramsPage() {
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const departmentOptions =
    departmentsData?.items.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.code})`,
    })) ?? [];

  const fields: FormField[] = [
    {
      name: 'departmentId',
      label: 'Department',
      type: 'select',
      required: true,
      options: departmentOptions.length
        ? departmentOptions
        : [{ value: '', label: 'No departments available' }],
    },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'code', label: 'Code', type: 'text', required: true },
    {
      name: 'durationYears',
      label: 'Duration (years)',
      type: 'number',
      required: true,
      min: 0.5,
      max: 10,
      step: 0.5,
    },
    {
      name: 'credits',
      label: 'Credits',
      type: 'number',
      required: true,
      min: 1,
      max: 500,
    },
    {
      name: 'level',
      label: 'Level',
      type: 'select',
      required: true,
      options: [
        { value: 'certificate', label: 'Certificate' },
        { value: 'diploma', label: 'Diploma' },
        { value: 'undergraduate', label: 'Undergraduate' },
        { value: 'postgraduate', label: 'Postgraduate' },
        { value: 'doctoral', label: 'Doctoral' },
      ],
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
    <ResourceCrudPage<Program>
      title="Programs"
      description="Academic programs offered by departments."
      exportFilename="programs"
      columns={columns}
      fields={fields}
      listQuery={usePrograms}
      createMutation={useCreateProgramMutation}
      updateMutation={useUpdateProgramMutation}
      archiveMutation={useArchiveProgramMutation}
      restoreMutation={useRestoreProgramMutation}
      getEditValues={(row) => ({
        departmentId: row.departmentId,
        name: row.name,
        code: row.code,
        durationYears: row.durationYears,
        credits: row.credits,
        level: row.level,
        status: row.status === 'archived' ? 'active' : row.status,
      })}
    />
  );
}
