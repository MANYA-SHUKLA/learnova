'use client';

import type { Department } from '@learnova/types';
import { useTranslations } from 'next-intl';
import {
  ResourceCrudPage,
  useArchiveDepartmentMutation,
  useCreateDepartmentMutation,
  useDepartments,
  useRestoreDepartmentMutation,
  useUpdateDepartmentMutation,
  type FormField,
  type ResourceColumn,
} from '@/features/institution';

export default function DepartmentsPage() {
  const t = useTranslations('dashboard.institution.departments');
  const tf = useTranslations('dashboard.institution.fields');
  const ts = useTranslations('dashboard.institution.status');

  const columns: ResourceColumn<Department>[] = [
    { id: 'name', header: tf('name'), cell: (r) => r.name, exportValue: (r) => r.name },
    { id: 'code', header: tf('code'), cell: (r) => r.code, exportValue: (r) => r.code },
  ];

  const fields: FormField[] = [
    {
      name: 'name',
      label: tf('name'),
      type: 'text',
      required: true,
      placeholder: 'B.Tech',
    },
    {
      name: 'code',
      label: tf('code'),
      type: 'text',
      required: true,
      placeholder: 'BTECH',
    },
    { name: 'description', label: tf('description'), type: 'textarea' },
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
    <ResourceCrudPage<Department>
      title={t('title')}
      singularLabel={t('singular')}
      description={t('description')}
      exportFilename="departments"
      columns={columns}
      fields={fields}
      listQuery={useDepartments}
      createMutation={useCreateDepartmentMutation}
      updateMutation={useUpdateDepartmentMutation}
      archiveMutation={useArchiveDepartmentMutation}
      restoreMutation={useRestoreDepartmentMutation}
      defaultStatusFilter="active"
      getEditValues={(row) => ({
        name: row.name,
        code: row.code,
        description: row.description ?? '',
        status: row.status === 'archived' ? 'active' : row.status,
      })}
    />
  );
}
