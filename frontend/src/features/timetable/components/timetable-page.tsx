'use client';

import type { Timetable, TimetableDayOfWeek, TimetableSlot } from '@learnova/types';
import { PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { useCourseList } from '@/features/course';
import { useFacultyList } from '@/features/faculty';
import {
  EmptyState,
  ErrorState,
  ExportMenu,
  PageHeader,
  PaginationControls,
  ResourceFormDialog,
  ResourceTable,
  type FormField,
  type ResourceColumn,
  useSemesters,
  useSections,
} from '@/features/institution';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  useCreateTimetableMutation,
  useCreateTimetableSlotMutation,
  useDeleteTimetableSlotMutation,
  usePublishTimetableMutation,
  useTimetableSlots,
  useTimetables,
  useUpdateTimetableSlotMutation,
} from '../hooks/use-timetable-queries';

const DAY_VALUES: TimetableDayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function normalizeTime(value: string): string {
  const match = value.trim().match(TIME_PATTERN);
  if (!match) return value.trim();
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export interface TimetablePageProps {
  mode: 'admin' | 'read';
}

function TimetableStatusBadge({ status }: { status: Timetable['status'] }) {
  const variant =
    status === 'published' ? 'success' : status === 'draft' ? 'warning' : 'secondary';
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

export function TimetablePage({ mode }: TimetablePageProps) {
  const isAdmin = mode === 'admin';
  const t = useTranslations('dashboard.timetable');
  const tDays = useTranslations('dashboard.timetable.days');
  const tCommon = useTranslations('common');
  const tCrud = useTranslations('dashboard.institution.crud');

  const [semesterId, setSemesterId] = useState('');
  const [dayFilter, setDayFilter] = useState<TimetableDayOfWeek | ''>('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimetableSlot | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: semestersData } = useSemesters({ limit: 100, status: 'active' });
  const selectedSemesterId = semesterId || semestersData?.items[0]?.id || '';

  const timetablesQuery = useTimetables(
    { semesterId: selectedSemesterId || undefined, limit: 1 },
    Boolean(selectedSemesterId),
  );
  const timetable = timetablesQuery.data?.items[0] ?? null;

  const slotsQuery = useTimetableSlots(
    timetable?.id ?? '',
    {
      page,
      limit: 50,
      dayOfWeek: dayFilter || undefined,
      sectionId: sectionFilter || undefined,
      sortBy: 'dayOfWeek',
      sortOrder: 'asc',
    },
    Boolean(timetable?.id),
  );

  const { data: sectionsData } = useSections({ limit: 100, status: 'active' });
  const { data: coursesData } = useCourseList({ limit: 100, status: 'published' });
  const { data: facultyData } = useFacultyList({ limit: 100, status: 'active' });

  const createTimetableMutation = useCreateTimetableMutation();
  const publishMutation = usePublishTimetableMutation();
  const createSlotMutation = useCreateTimetableSlotMutation(timetable?.id ?? '');
  const updateSlotMutation = useUpdateTimetableSlotMutation(timetable?.id ?? '');
  const deleteSlotMutation = useDeleteTimetableSlotMutation(timetable?.id ?? '');

  const dayOptions = DAY_VALUES.map((d) => ({ value: d, label: tDays(d) }));

  const filteredRows = useMemo(() => {
    const items = slotsQuery.data?.items ?? [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (row) =>
        row.courseTitle.toLowerCase().includes(q) ||
        row.sectionName.toLowerCase().includes(q) ||
        row.facultyName.toLowerCase().includes(q) ||
        row.room.toLowerCase().includes(q),
    );
  }, [slotsQuery.data?.items, search]);

  const columns: ResourceColumn<TimetableSlot>[] = [
    {
      id: 'day',
      header: t('columns.day'),
      cell: (r) => tDays(r.dayOfWeek),
      exportValue: (r) => tDays(r.dayOfWeek),
    },
    {
      id: 'time',
      header: t('columns.time'),
      cell: (r) => `${r.startTime} – ${r.endTime}`,
      exportValue: (r) => `${r.startTime}-${r.endTime}`,
    },
    {
      id: 'course',
      header: t('columns.course'),
      cell: (r) => r.courseTitle,
      exportValue: (r) => r.courseTitle,
    },
    {
      id: 'section',
      header: t('columns.section'),
      cell: (r) => r.sectionName,
      exportValue: (r) => r.sectionName,
    },
    {
      id: 'faculty',
      header: t('columns.faculty'),
      cell: (r) => r.facultyName,
      exportValue: (r) => r.facultyName,
    },
    {
      id: 'room',
      header: t('columns.room'),
      cell: (r) => r.room,
      exportValue: (r) => r.room,
    },
  ];

  const formFields: FormField[] = useMemo(() => {
    const sectionOptions =
      sectionsData?.items.map((s) => ({ value: s.id, label: s.name })) ?? [];
    const courseOptions =
      coursesData?.items.map((c) => ({ value: c.id, label: c.title })) ?? [];
    const facultyOptions =
      facultyData?.items.map((f) => ({
        value: f.id,
        label: f.fullName || `${f.firstName} ${f.lastName}`.trim(),
      })) ?? [];

    return [
      {
        name: 'dayOfWeek',
        label: t('columns.day'),
        type: 'select',
        required: true,
        options: dayOptions,
      },
      { name: 'startTime', label: t('fields.startTime'), type: 'time', required: true },
      { name: 'endTime', label: t('fields.endTime'), type: 'time', required: true },
      {
        name: 'courseId',
        label: t('columns.course'),
        type: 'select',
        required: true,
        options: courseOptions.length ? courseOptions : [{ value: '', label: t('noCourses') }],
      },
      {
        name: 'sectionId',
        label: t('columns.section'),
        type: 'select',
        required: true,
        options: sectionOptions.length ? sectionOptions : [{ value: '', label: t('noSections') }],
      },
      {
        name: 'facultyId',
        label: t('columns.faculty'),
        type: 'select',
        required: true,
        options: facultyOptions.length ? facultyOptions : [{ value: '', label: t('noFaculty') }],
      },
      { name: 'room', label: t('columns.room'), type: 'text', required: true },
    ];
  }, [sectionsData, coursesData, facultyData, dayOptions, t]);

  const handleCreateTimetable = async () => {
    const semester = semestersData?.items.find((s) => s.id === selectedSemesterId);
    if (!semester) return;
    setFormError(null);
    try {
      await createTimetableMutation.mutateAsync({
        semesterId: semester.id,
        academicYearId: semester.academicYearId,
        name: `${semester.name} Timetable`,
      });
    } catch {
      setFormError(t('createFailed'));
    }
  };

  const handlePublish = async () => {
    if (!timetable) return;
    setFormError(null);
    try {
      await publishMutation.mutateAsync(timetable.id);
    } catch {
      setFormError(t('publishFailed'));
    }
  };

  const handleSubmitSlot = async (values: Record<string, string | number | boolean | null>) => {
    if (!timetable) return;
    setFormError(null);

    const startTime = normalizeTime(String(values['startTime'] ?? ''));
    const endTime = normalizeTime(String(values['endTime'] ?? ''));
    const courseId = String(values['courseId'] ?? '').trim();
    const sectionId = String(values['sectionId'] ?? '').trim();
    const facultyId = String(values['facultyId'] ?? '').trim();
    const room = String(values['room'] ?? '').trim();

    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      setFormError(t('invalidTime'));
      return;
    }
    if (startTime >= endTime) {
      setFormError(t('endBeforeStart'));
      return;
    }
    if (!OBJECT_ID_PATTERN.test(courseId)) {
      setFormError(t('selectCourse'));
      return;
    }
    if (!OBJECT_ID_PATTERN.test(sectionId)) {
      setFormError(t('selectSection'));
      return;
    }
    if (!OBJECT_ID_PATTERN.test(facultyId)) {
      setFormError(t('selectFaculty'));
      return;
    }
    if (!room) {
      setFormError(t('roomRequired'));
      return;
    }

    const body = {
      dayOfWeek: String(values['dayOfWeek']) as TimetableDayOfWeek,
      startTime,
      endTime,
      courseId,
      sectionId,
      facultyId,
      room,
    };
    try {
      if (editing) {
        await updateSlotMutation.mutateAsync({ id: editing.id, body });
      } else {
        await createSlotMutation.mutateAsync(body);
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      setFormError(getApiErrorMessage(err, t('saveFailed')));
    }
  };

  const exportHeaders = columns.map((c) => c.header);
  const exportRows = filteredRows.map((row) =>
    columns.map((c) => c.exportValue?.(row) ?? ''),
  );

  const semesterOptions = semestersData?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={
          isAdmin ? (
            <PermissionGate permission={PERMISSIONS.TIMETABLE_MANAGE}>
              <div className="flex flex-wrap gap-2">
                {!timetable ? (
                  <Button
                    type="button"
                    disabled={!selectedSemesterId || createTimetableMutation.isPending}
                    onClick={() => void handleCreateTimetable()}
                  >
                    {t('createTimetable')}
                  </Button>
                ) : timetable.status !== 'published' ? (
                  <Button
                    type="button"
                    variant="default"
                    disabled={publishMutation.isPending}
                    onClick={() => void handlePublish()}
                  >
                    {t('publish')}
                  </Button>
                ) : null}
                {timetable ? (
                  <Button
                    type="button"
                    disabled={createSlotMutation.isPending}
                    onClick={() => {
                      setEditing(null);
                      setFormError(null);
                      setDialogOpen(true);
                    }}
                  >
                    {t('addSlot')}
                  </Button>
                ) : null}
              </div>
            </PermissionGate>
          ) : undefined
        }
      />

      <Card className="rounded-2xl shadow-soft-md">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('tableTitle')}</CardTitle>
            <CardDescription>{t('tableDescription')}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {timetable ? <TimetableStatusBadge status={timetable.status} /> : null}
            <ExportMenu
              filename={`timetable-${selectedSemesterId || 'export'}`}
              headers={exportHeaders}
              rows={exportRows}
              disabled={filteredRows.length === 0}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select
              className="flex h-10 min-w-[180px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={selectedSemesterId}
              onChange={(e) => {
                setSemesterId(e.target.value);
                setPage(1);
              }}
            >
              {semesterOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="flex h-10 min-w-[140px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={dayFilter}
              onChange={(e) => {
                setDayFilter(e.target.value as TimetableDayOfWeek | '');
                setPage(1);
              }}
            >
              <option value="">{t('allDays')}</option>
              {dayOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <select
              className="flex h-10 min-w-[160px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={sectionFilter}
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('allSections')}</option>
              {(sectionsData?.items ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Input
              className="max-w-xs"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          {timetablesQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : timetablesQuery.isError ? (
            <ErrorState message={t('loadFailed')} />
          ) : !timetable ? (
            <EmptyState
              title={t('emptyTitle')}
              description={isAdmin ? t('emptyDescriptionAdmin') : t('emptyDescriptionRead')}
            />
          ) : !isAdmin && timetable.status !== 'published' ? (
            <EmptyState title={t('notPublishedTitle')} description={t('notPublishedDescription')} />
          ) : slotsQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : slotsQuery.isError ? (
            <ErrorState message={t('loadFailed')} />
          ) : (
            <>
              <ResourceTable
                columns={columns}
                rows={filteredRows}
                emptyTitle={t('noSlotsTitle')}
                emptyDescription={isAdmin ? t('noSlotsDescriptionAdmin') : t('noSlotsDescriptionRead')}
                rowActions={
                  isAdmin
                    ? (row) => (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(row);
                              setFormError(null);
                              setDialogOpen(true);
                            }}
                          >
                            {tCommon('edit')}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            disabled={deleteSlotMutation.isPending}
                            onClick={() => void deleteSlotMutation.mutateAsync(row.id)}
                          >
                            {tCrud('delete')}
                          </Button>
                        </div>
                      )
                    : undefined
                }
              />
              {slotsQuery.data?.meta ? (
                <PaginationControls
                  page={slotsQuery.data.meta.page}
                  totalPages={slotsQuery.data.meta.totalPages}
                  hasNextPage={slotsQuery.data.meta.hasNextPage}
                  hasPrevPage={slotsQuery.data.meta.hasPrevPage}
                  total={slotsQuery.data.meta.total}
                  onPageChange={setPage}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {isAdmin && timetable ? (
        <ResourceFormDialog
          open={dialogOpen}
          title={editing ? t('editSlot') : t('addSlot')}
          fields={formFields}
          initialValues={
            editing
              ? {
                  dayOfWeek: editing.dayOfWeek,
                  startTime: editing.startTime,
                  endTime: editing.endTime,
                  courseId: editing.courseId,
                  sectionId: editing.sectionId,
                  facultyId: editing.facultyId,
                  room: editing.room,
                }
              : {
                  dayOfWeek: 'mon',
                  startTime: '09:00',
                  endTime: '10:00',
                }
          }
          isSubmitting={createSlotMutation.isPending || updateSlotMutation.isPending}
          error={formError}
          onClose={() => {
            setDialogOpen(false);
            setEditing(null);
            setFormError(null);
          }}
          onSubmit={handleSubmitSlot}
        />
      ) : null}
    </div>
  );
}
