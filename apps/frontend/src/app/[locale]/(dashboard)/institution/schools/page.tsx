'use client';

import type { School } from '@learnova/types';
import {
  ResourceCrudPage,
  useArchiveSchoolMutation,
  useCreateSchoolMutation,
  useRestoreSchoolMutation,
  useSchools,
  useUpdateSchoolMutation,
  type FormField,
  type ResourceColumn,
} from '@/features/institution';

const columns: ResourceColumn<School>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, exportValue: (r) => r.name },
  { id: 'code', header: 'Code', cell: (r) => r.code, exportValue: (r) => r.code },
  {
    id: 'description',
    header: 'Description',
    cell: (r) => r.description ?? '—',
    exportValue: (r) => r.description,
  },
];

const fields: FormField[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'code', label: 'Code', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
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

export default function SchoolsPage() {
  return (
    <ResourceCrudPage<School>
      title="Schools"
      description="Organize faculties and schools under the institution."
      exportFilename="schools"
      columns={columns}
      fields={fields}
      listQuery={useSchools}
      createMutation={useCreateSchoolMutation}
      updateMutation={useUpdateSchoolMutation}
      archiveMutation={useArchiveSchoolMutation}
      restoreMutation={useRestoreSchoolMutation}
      getEditValues={(row) => ({
        name: row.name,
        code: row.code,
        description: row.description ?? '',
        status: row.status === 'archived' ? 'active' : row.status,
      })}
    />
  );
}
