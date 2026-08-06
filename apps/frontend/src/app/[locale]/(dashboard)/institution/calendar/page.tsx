'use client';

import type { AcademicCalendar } from '@learnova/types';
import {
  ResourceCrudPage,
  useAcademicCalendars,
  useAcademicYears,
  useArchiveAcademicCalendarMutation,
  useCreateAcademicCalendarMutation,
  useRestoreAcademicCalendarMutation,
  useUpdateAcademicCalendarMutation,
  type FormField,
  type ResourceColumn,
} from '@/features/institution';

const columns: ResourceColumn<AcademicCalendar>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, exportValue: (r) => r.name },
  {
    id: 'academicYearId',
    header: 'Year ID',
    cell: (r) => <span className="font-mono text-xs">{r.academicYearId}</span>,
    exportValue: (r) => r.academicYearId,
  },
  {
    id: 'events',
    header: 'Events',
    cell: (r) => r.events.length,
    exportValue: (r) => r.events.length,
  },
];

export default function AcademicCalendarPage() {
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
    { name: 'name', label: 'Calendar name', type: 'text', required: true },
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
    <ResourceCrudPage<AcademicCalendar>
      title="Academic calendars"
      description="Calendars for academic years. Event editing can be expanded later; create starts with an empty event list."
      exportFilename="academic-calendars"
      columns={columns}
      fields={fields}
      listQuery={useAcademicCalendars}
      createMutation={useCreateAcademicCalendarMutation}
      updateMutation={useUpdateAcademicCalendarMutation}
      archiveMutation={useArchiveAcademicCalendarMutation}
      restoreMutation={useRestoreAcademicCalendarMutation}
      mapValuesToBody={(values) => ({
        academicYearId: values['academicYearId'],
        name: values['name'],
        status: values['status'],
        events: [],
      })}
      getEditValues={(row) => ({
        academicYearId: row.academicYearId,
        name: row.name,
        status: row.status === 'archived' ? 'active' : row.status,
      })}
    />
  );
}
