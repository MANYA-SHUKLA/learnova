'use client';

import type { Program } from '@learnova/types';
import { useTranslations } from 'next-intl';
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

export default function ProgramsPage() {
  const t = useTranslations('dashboard.institution.programs');
  const tf = useTranslations('dashboard.institution.fields');
  const ts = useTranslations('dashboard.institution.status');
  const tl = useTranslations('dashboard.institution.levels');
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const departmentOptions =
    departmentsData?.items.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.code})`,
    })) ?? [];

  const columns: ResourceColumn<Program>[] = [
    { id: 'name', header: tf('name'), cell: (r) => r.name, exportValue: (r) => r.name },
    { id: 'code', header: tf('code'), cell: (r) => r.code, exportValue: (r) => r.code },
    { id: 'level', header: tf('level'), cell: (r) => r.level, exportValue: (r) => r.level },
    {
      id: 'duration',
      header: tf('years'),
      cell: (r) => r.durationYears,
      exportValue: (r) => r.durationYears,
    },
    {
      id: 'credits',
      header: tf('credits'),
      cell: (r) => r.credits,
      exportValue: (r) => r.credits,
    },
  ];

  const fields: FormField[] = [
    {
      name: 'departmentId',
      label: tf('department'),
      type: 'select',
      required: true,
      options: departmentOptions.length
        ? departmentOptions
        : [{ value: '', label: tf('noDepartments') }],
    },
    { name: 'name', label: tf('name'), type: 'text', required: true },
    { name: 'code', label: tf('code'), type: 'text', required: true },
    {
      name: 'durationYears',
      label: tf('durationYears'),
      type: 'number',
      required: true,
      min: 0.5,
      max: 10,
      step: 0.5,
    },
    {
      name: 'credits',
      label: tf('credits'),
      type: 'number',
      required: true,
      min: 1,
      max: 500,
    },
    {
      name: 'level',
      label: tf('level'),
      type: 'select',
      required: true,
      options: [
        { value: 'certificate', label: tl('certificate') },
        { value: 'diploma', label: tl('diploma') },
        { value: 'undergraduate', label: tl('undergraduate') },
        { value: 'postgraduate', label: tl('postgraduate') },
        { value: 'doctoral', label: tl('doctoral') },
      ],
    },
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
    <ResourceCrudPage<Program>
      title={t('title')}
      singularLabel={t('singular')}
      description={t('description')}
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
