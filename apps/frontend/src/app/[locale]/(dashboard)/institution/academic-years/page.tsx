'use client';

import type { AcademicYear } from '@learnova/types';
import { Badge } from '@learnova/ui';
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

const columns: ResourceColumn<AcademicYear>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, exportValue: (r) => r.name },
  {
    id: 'startDate',
    header: 'Start',
    cell: (r) => toDateInput(r.startDate),
    exportValue: (r) => r.startDate,
  },
  {
    id: 'endDate',
    header: 'End',
    cell: (r) => toDateInput(r.endDate),
    exportValue: (r) => r.endDate,
  },
  {
    id: 'isActive',
    header: 'Active',
    cell: (r) =>
      r.isActive ? <Badge variant="success">Current</Badge> : <span className="text-muted-foreground">—</span>,
    exportValue: (r) => r.isActive,
  },
];

const fields: FormField[] = [
  { name: 'name', label: 'Name', type: 'text', required: true, placeholder: '2025-26' },
  { name: 'startDate', label: 'Start date', type: 'date', required: true },
  { name: 'endDate', label: 'End date', type: 'date', required: true },
  { name: 'isActive', label: 'Mark as active year', type: 'checkbox' },
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

export default function AcademicYearsPage() {
  return (
    <ResourceCrudPage<AcademicYear>
      title="Academic years"
      description="Define academic year ranges and the currently active year."
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
