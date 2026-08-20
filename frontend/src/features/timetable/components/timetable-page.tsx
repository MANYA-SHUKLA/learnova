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
import { WeeklyTimetableGrid } from './weekly-timetable-grid';

const DAY_VALUES: TimetableDayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function normalizeTime(value: string): string {
  const match = value.trim().match(TIME_PATTERN);
  if (!match?.[1] || !match[2]) return value.trim();
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function filterSlotsBySearch(slots: TimetableSlot[], search: string): TimetableSlot[] {
  if (!search.trim()) return slots;
  const q = search.toLowerCase();
  return slots.filter(
    (row) =>
      row.courseTitle.toLowerCase().includes(q) ||
      row.sectionName.toLowerCase().includes(q) ||
      row.facultyName.toLowerCase().includes(q) ||
      row.room.toLowerCase().includes(q),
  );
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

  const [semesterId, setSemesterId] = useState('');
  const [dayFilter, setDayFilter] = useState<TimetableDayOfWeek | ''>('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimetableSlot | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: semestersData } = useSemesters({ limit: 100, status: 'active' }, isAdmin);

  const publishedTimetablesQuery = useTimetables(
    { status: 'published', limit: 50 },
    !isAdmin,
  );

  const selectedSemesterId = useMemo(() => {
    if (semesterId) return semesterId;
    if (!isAdmin) {
      const published = publishedTimetablesQuery.data?.items ?? [];
      if (published.length > 0) {
        return published[0]?.semesterId ?? '';
      }
    }
    return semestersData?.items[0]?.id || '';
  }, [semesterId, isAdmin, publishedTimetablesQuery.data?.items, semestersData?.items]);

  const timetablesQuery = useTimetables(
    {
      semesterId: selectedSemesterId || undefined,
      limit: 1,
      ...(!isAdmin ? { status: 'published' as const } : {}),
    },
    Boolean(selectedSemesterId) && (isAdmin || !publishedTimetablesQuery.isLoading || Boolean(semesterId)),
  );
  const timetable = timetablesQuery.data?.items[0] ?? null;

  const draftTimetablesQuery = useTimetables(
    {
      semesterId: selectedSemesterId || undefined,
      status: 'draft',
      limit: 1,
    },
    !isAdmin && Boolean(selectedSemesterId) && !timetable && !timetablesQuery.isLoading,
  );
  const draftTimetable = draftTimetablesQuery.data?.items[0] ?? null;

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
    Boolean(timetable?.id) && isAdmin,
  );

  const gridSlotsQuery = useTimetableSlots(
    timetable?.id ?? '',
    {
      limit: 500,
      sortBy: 'startTime',
      sortOrder: 'asc',
    },
    Boolean(timetable?.id),
  );

  const { data: sectionsData } = useSections({ limit: 100, status: 'active' }, isAdmin);
  const { data: coursesData } = useCourseList({ limit: 100, status: 'published' });
  const { data: facultyData } = useFacultyList({ limit: 100, status: 'active' });

  const createTimetableMutation = useCreateTimetableMutation();
  const publishMutation = usePublishTimetableMutation();
  const createSlotMutation = useCreateTimetableSlotMutation(timetable?.id ?? '');
  const updateSlotMutation = useUpdateTimetableSlotMutation(timetable?.id ?? '');
  const deleteSlotMutation = useDeleteTimetableSlotMutation(timetable?.id ?? '');

  const dayOptions = DAY_VALUES.map((d) => ({ value: d, label: tDays(d) }));

  const filteredRows = useMemo(
    () => filterSlotsBySearch(slotsQuery.data?.items ?? [], search),
    [slotsQuery.data?.items, search],
  );

  const gridSlots = useMemo(() => {
    let items = gridSlotsQuery.data?.items ?? [];
    if (sectionFilter) {
      items = items.filter((slot) => slot.sectionId === sectionFilter);
    }
    if (dayFilter) {
      items = items.filter((slot) => slot.dayOfWeek === dayFilter);
    }
    return filterSlotsBySearch(items, search);
  }, [gridSlotsQuery.data?.items, sectionFilter, dayFilter, search]);

  const readSectionOptions = useMemo(() => {
    const items = gridSlotsQuery.data?.items ?? [];
    const bySection = new Map<string, string>();
    for (const slot of items) {
      bySection.set(slot.sectionId, slot.sectionName);
    }
    return [...bySection.entries()].map(([id, name]) => ({ id, name }));
  }, [gridSlotsQuery.data?.items]);

  const sectionOptions = isAdmin ? (sectionsData?.items ?? []) : readSectionOptions;

  const dayLabels = useMemo(
    () =>
      Object.fromEntries(DAY_VALUES.map((day) => [day, tDays(day)])) as Record<
        TimetableDayOfWeek,
        string
      >,
    [tDays],
  );

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

  const exportSourceRows = gridSlots;
  const exportHeaders = columns.map((c) => c.header);
  const exportRows = exportSourceRows.map((row) =>
    columns.map((c) => c.exportValue?.(row) ?? ''),
  );

  const readSemesterOptions = useMemo(() => {
    const items = publishedTimetablesQuery.data?.items ?? [];
    const bySemester = new Map<string, string>();
    for (const tt of items) {
      if (!bySemester.has(tt.semesterId)) {
        const label = tt.name.replace(/\s+timetable$/i, '').trim() || tt.name;
        bySemester.set(tt.semesterId, label);
      }
    }
    return [...bySemester.entries()].map(([id, name]) => ({ id, name }));
  }, [publishedTimetablesQuery.data?.items]);

  const semesterOptions = isAdmin ? (semestersData?.items ?? []) : readSemesterOptions;

  const selectedSemesterName = useMemo(() => {
    const fromOptions = semesterOptions.find((s) => s.id === selectedSemesterId)?.name;
    if (fromOptions) return fromOptions;
    if (timetable?.name) {
      return timetable.name.replace(/\s+timetable$/i, '').trim() || timetable.name;
    }
    return '';
  }, [semesterOptions, selectedSemesterId, timetable?.name]);

  return (
    <div className="space-y-6">
      <div className="timetable-no-print">
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
      </div>

      {gridSlots.length > 0 ? (
        <div className="timetable-print-only">
          <WeeklyTimetableGrid
            slots={gridSlots}
            dayLabels={dayLabels}
            timeColumnLabel={t('gridTimeColumn')}
            title={t('gridTitle')}
            subtitle={selectedSemesterName}
          />
        </div>
      ) : null}

      <Card className="timetable-no-print rounded-2xl shadow-soft-md">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('gridTitle')}</CardTitle>
            <CardDescription>{t('tableDescription')}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {timetable ? <TimetableStatusBadge status={timetable.status} /> : null}
            <ExportMenu
              filename={`timetable-${selectedSemesterId || 'export'}`}
              headers={exportHeaders}
              rows={exportRows}
              disabled={gridSlots.length === 0}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-foreground">{t('semesterLabel')}</span>
              <select
                className="flex h-10 min-w-[180px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={selectedSemesterId}
                disabled={!isAdmin && publishedTimetablesQuery.isLoading}
                onChange={(e) => {
                  setSemesterId(e.target.value);
                  setPage(1);
                }}
              >
                {semesterOptions.length === 0 ? (
                  <option value="">{t('selectSemester')}</option>
                ) : (
                  semesterOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
            </label>
            {isAdmin ? (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-foreground">{t('columns.day')}</span>
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
            </label>
            ) : null}
            <select
              className="flex h-10 min-w-[160px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={sectionFilter}
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('allSections')}</option>
              {sectionOptions.map((s) => (
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
              title={draftTimetable ? t('notPublishedTitle') : t('emptyTitle')}
              description={
                draftTimetable
                  ? t('notPublishedDescription')
                  : isAdmin
                    ? t('emptyDescriptionAdmin')
                    : t('emptyDescriptionRead')
              }
            />
          ) : !isAdmin && timetable.status !== 'published' ? (
            <EmptyState title={t('notPublishedTitle')} description={t('notPublishedDescription')} />
          ) : gridSlotsQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : gridSlotsQuery.isError ? (
            <ErrorState message={t('loadFailed')} />
          ) : (
            <div className="space-y-6">
              {gridSlots.length === 0 ? (
                <EmptyState
                  title={t('noSlotsTitle')}
                  description={isAdmin ? t('noSlotsDescriptionAdmin') : t('noSlotsDescriptionRead')}
                />
              ) : (
                <WeeklyTimetableGrid
                  slots={gridSlots}
                  dayLabels={dayLabels}
                  timeColumnLabel={t('gridTimeColumn')}
                  title={t('gridTitle')}
                  subtitle={selectedSemesterName}
                />
              )}
              {isAdmin ? (
                <div className="space-y-4 border-t border-border pt-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{t('manageSlotsTitle')}</h3>
                    <p className="text-sm text-muted-foreground">{t('tableDescription')}</p>
                  </div>
                  {slotsQuery.isLoading ? (
                    <Skeleton className="h-48 w-full rounded-xl" />
                  ) : slotsQuery.isError ? (
                    <ErrorState message={t('loadFailed')} />
                  ) : (
                    <>
                      <ResourceTable
                        columns={columns}
                        rows={filteredRows}
                        emptyTitle={t('noSlotsTitle')}
                        emptyDescription={t('noSlotsDescriptionAdmin')}
                        rowActions={(row) => (
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
                              {tCommon('delete')}
                            </Button>
                          </div>
                        )}
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
                </div>
              ) : null}
            </div>
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
