'use client';

import type { Semester } from '@learnova/types';
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

const columns: ResourceColumn<Semester>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, exportValue: (r) => r.name },
  { id: 'number', header: 'Number', cell: (r) => r.number, exportValue: (r) => r.number },
  { id: 'term', header: 'Term', cell: (r) => r.term, exportValue: (r) => r.term },
  {
    id: 'academicYearId',
    header: 'Year ID',
    cell: (r) => <span className="font-mono text-xs">{r.academicYearId}</span>,
    exportValue: (r) => r.academicYearId,
  },
];

export default function SemestersPage() {
  const { data: yearsData } = useAcademicYears({ limit: 100 });
  const yearOptions =
    yearsData?.items.map((y) => ({ value: y.id, label: y.name })) ?? [];

  const fields: FormField[] = [
    {
      name: 'academicYearId',
      label: 'Academic year',
      type: 'select',
      required: true,
      options: yearOptions.length
        ? yearOptions
        : [{ value: '', label: 'No academic years available' }],
    },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'number', label: 'Number', type: 'number', required: true, min: 1, max: 20 },
    {
      name: 'term',
      label: 'Term',
      type: 'select',
      required: true,
      options: [
        { value: 'odd', label: 'Odd' },
        { value: 'even', label: 'Even' },
        { value: 'summer', label: 'Summer' },
      ],
    },
    { name: 'startDate', label: 'Start date', type: 'date' },
    { name: 'endDate', label: 'End date', type: 'date' },
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
    <ResourceCrudPage<Semester>
      title="Semesters"
      description="Terms nested under an academic year."
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
