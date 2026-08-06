'use client';

import type { Campus } from '@learnova/types';
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

const columns: ResourceColumn<Campus>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, exportValue: (r) => r.name },
  { id: 'code', header: 'Code', cell: (r) => r.code, exportValue: (r) => r.code },
  {
    id: 'city',
    header: 'City',
    cell: (r) => r.city ?? '—',
    exportValue: (r) => r.city,
  },
  {
    id: 'country',
    header: 'Country',
    cell: (r) => r.country ?? '—',
    exportValue: (r) => r.country,
  },
];

const fields: FormField[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'code', label: 'Code', type: 'text', required: true },
  { name: 'address', label: 'Address', type: 'text' },
  { name: 'city', label: 'City', type: 'text' },
  { name: 'state', label: 'State', type: 'text' },
  { name: 'country', label: 'Country', type: 'text' },
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
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

export default function CampusesPage() {
  return (
    <ResourceCrudPage<Campus>
      title="Campuses"
      description="Manage campus locations for your institution."
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
