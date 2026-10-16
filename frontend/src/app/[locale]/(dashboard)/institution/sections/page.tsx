'use client';

import type { Section } from '@learnova/types';
import { useTranslations } from 'next-intl';
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

export default function SectionsPage() {
  const t = useTranslations('dashboard.institution.sections');
  const tf = useTranslations('dashboard.institution.fields');
  const ts = useTranslations('dashboard.institution.status');
  const { data: programsData } = usePrograms({ limit: 100 });
  const { data: semestersData } = useSemesters({ limit: 100 });

  const programOptions =
    programsData?.items.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })) ?? [];
  const semesterOptions =
    semestersData?.items.map((s) => ({ value: s.id, label: s.name })) ?? [];

  const columns: ResourceColumn<Section>[] = [
    { id: 'name', header: tf('name'), cell: (r) => r.name, exportValue: (r) => r.name },
    {
      id: 'capacity',
      header: tf('capacity'),
      cell: (r) => r.capacity,
      exportValue: (r) => r.capacity,
    },
    {
      id: 'program',
      header: tf('program'),
      cell: (r) => programOptions.find((program) => program.value === r.programId)?.label ?? '—',
      exportValue: (r) => programOptions.find((program) => program.value === r.programId)?.label ?? '',
    },
    {
      id: 'semester',
      header: tf('semester'),
      cell: (r) => semesterOptions.find((semester) => semester.value === r.semesterId)?.label ?? '—',
      exportValue: (r) => semesterOptions.find((semester) => semester.value === r.semesterId)?.label ?? '',
    },
  ];

  const fields: FormField[] = [
    {
      name: 'programId',
      label: tf('program'),
      type: 'select',
      required: true,
      options: programOptions.length
        ? programOptions
        : [{ value: '', label: tf('noPrograms') }],
    },
    {
      name: 'semesterId',
      label: tf('semester'),
      type: 'select',
      required: true,
      options: semesterOptions.length
        ? semesterOptions
        : [{ value: '', label: tf('noSemesters') }],
    },
    { name: 'name', label: tf('name'), type: 'text', required: true, placeholder: 'A' },
    {
      name: 'capacity',
      label: tf('capacity'),
      type: 'number',
      required: true,
      min: 1,
      max: 500,
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
    <ResourceCrudPage<Section>
      title={t('title')}
      singularLabel={t('singular')}
      description={t('description')}
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
