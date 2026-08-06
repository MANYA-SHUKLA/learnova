'use client';

import type { Department } from '@learnova/types';
import {
  ResourceCrudPage,
  useArchiveDepartmentMutation,
  useCreateDepartmentMutation,
  useDepartments,
  useRestoreDepartmentMutation,
  useSchools,
  useUpdateDepartmentMutation,
  type FormField,
  type ResourceColumn,
} from '@/features/institution';

const columns: ResourceColumn<Department>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, exportValue: (r) => r.name },
  { id: 'code', header: 'Code', cell: (r) => r.code, exportValue: (r) => r.code },
  {
    id: 'schoolId',
    header: 'School ID',
    cell: (r) => <span className="font-mono text-xs">{r.schoolId}</span>,
    exportValue: (r) => r.schoolId,
  },
];

export default function DepartmentsPage() {
  const { data: schoolsData } = useSchools({ limit: 100 });
  const schoolOptions =
    schoolsData?.items.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })) ?? [];

  const fields: FormField[] = [
    {
      name: 'schoolId',
      label: 'School',
      type: 'select',
      required: true,
      options: schoolOptions.length
        ? schoolOptions
        : [{ value: '', label: 'No schools available' }],
    },
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

  return (
    <ResourceCrudPage<Department>
      title="Departments"
      description="Departments belong to a school within the institution."
      exportFilename="departments"
      columns={columns}
      fields={fields}
      listQuery={useDepartments}
      createMutation={useCreateDepartmentMutation}
      updateMutation={useUpdateDepartmentMutation}
      archiveMutation={useArchiveDepartmentMutation}
      restoreMutation={useRestoreDepartmentMutation}
      getEditValues={(row) => ({
        schoolId: row.schoolId,
        name: row.name,
        code: row.code,
        description: row.description ?? '',
        status: row.status === 'archived' ? 'active' : row.status,
      })}
    />
  );
}
