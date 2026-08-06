'use client';

import type { AcademicCalendar, CalendarEventType } from '@learnova/types';
import { PERMISSIONS } from '@learnova/constants';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@learnova/ui';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  EmptyState,
  ErrorState,
  ExportMenu,
  PageHeader,
  PaginationControls,
  ResourceFormDialog,
  ResourceTable,
  StatusBadge,
  useAcademicCalendars,
  useAcademicYears,
  useArchiveAcademicCalendarMutation,
  useCreateAcademicCalendarMutation,
  useRestoreAcademicCalendarMutation,
  useUpdateAcademicCalendarMutation,
  type FormField,
  type ResourceColumn,
} from '@/features/institution';

const EVENT_TYPES: { value: CalendarEventType; label: string }[] = [
  { value: 'semester_start', label: 'Semester start' },
  { value: 'semester_end', label: 'Semester end' },
  { value: 'exam_start', label: 'Exam start' },
  { value: 'exam_end', label: 'Exam end' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'event', label: 'Event' },
];

interface DraftEvent {
  type: CalendarEventType;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

const emptyEvent = (): DraftEvent => ({
  type: 'event',
  title: '',
  description: '',
  startDate: '',
  endDate: '',
});

const columns: ResourceColumn<AcademicCalendar>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, exportValue: (r) => r.name },
  {
    id: 'events',
    header: 'Events',
    cell: (r) => r.events.length,
    exportValue: (r) => r.events.length,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (r) => <StatusBadge status={r.status} />,
    exportValue: (r) => r.status,
  },
];

export default function AcademicCalendarPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicCalendar | null>(null);
  const [events, setEvents] = useState<DraftEvent[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const listQuery = useAcademicCalendars({ page, limit: 20, q: q || undefined });
  const { data: yearsData } = useAcademicYears({ limit: 100 });
  const createMutation = useCreateAcademicCalendarMutation();
  const updateMutation = useUpdateAcademicCalendarMutation();
  const archiveMutation = useArchiveAcademicCalendarMutation();
  const restoreMutation = useRestoreAcademicCalendarMutation();

  const fields: FormField[] = useMemo(() => {
    const yearOptions =
      yearsData?.items.map((y) => ({ value: y.id, label: y.name })) ?? [];
    return [
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
  }, [yearsData?.items]);

  const openCreate = () => {
    setEditing(null);
    setEvents([]);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (row: AcademicCalendar) => {
    setEditing(row);
    setEvents(
      row.events.map((e) => ({
        type: e.type,
        title: e.title,
        description: e.description ?? '',
        startDate: e.startDate.slice(0, 10),
        endDate: e.endDate.slice(0, 10),
      })),
    );
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: Record<string, string | number | boolean | null>) => {
    setFormError(null);
    for (const ev of events) {
      if (!ev.title.trim() || !ev.startDate || !ev.endDate) {
        setFormError('Each event needs a title, start date, and end date.');
        return;
      }
    }
    const body = {
      academicYearId: String(values['academicYearId'] ?? ''),
      name: String(values['name'] ?? ''),
      status: (String(values['status'] ?? 'active') as 'active' | 'inactive' | 'archived'),
      events: events.map((e) => ({
        type: e.type,
        title: e.title.trim(),
        description: e.description.trim() || null,
        startDate: e.startDate,
        endDate: e.endDate,
      })),
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
      } else {
        await createMutation.mutateAsync(body);
      }
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  if (listQuery.isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (listQuery.isError) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <ErrorState
          message={
            listQuery.error instanceof Error
              ? listQuery.error.message
              : 'Failed to load calendars.'
          }
          onRetry={() => void listQuery.refetch()}
        />
      </main>
    );
  }

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        title="Academic calendars"
        description="Semester starts/ends, exam windows, holidays, and institutional events."
        actions={
          <div className="flex flex-wrap gap-2">
            <ExportMenu
              filename="academic-calendars.csv"
              headers={columns.map((c) => c.header)}
              rows={items.map((row) =>
                columns.map((c) => (c.exportValue ? c.exportValue(row) : '')),
              )}
            />
            <PermissionGate permission={PERMISSIONS.INSTITUTION_MANAGE} enforce>
              <Button type="button" onClick={openCreate}>
                New calendar
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search calendars…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No calendars yet"
          description="Create a calendar for an academic year and add key dates."
        />
      ) : (
        <>
          <ResourceTable
            columns={columns}
            rows={items}
            rowActions={(row) => (
              <PermissionGate permission={PERMISSIONS.INSTITUTION_MANAGE} enforce>
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { openEdit(row); }}>
                    Edit
                  </Button>
                  {row.deletedAt ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void restoreMutation.mutateAsync(row.id)}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void archiveMutation.mutateAsync(row.id)}
                    >
                      Archive
                    </Button>
                  )}
                </>
              </PermissionGate>
            )}
          />
          {meta ? (
            <PaginationControls
              page={meta.page}
              totalPages={meta.totalPages}
              hasNextPage={meta.hasNextPage}
              hasPrevPage={meta.hasPrevPage}
              total={meta.total}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <ResourceFormDialog
        open={dialogOpen}
        title={editing ? 'Edit calendar' : 'Create calendar'}
        description="Add semester, exam, holiday, and event entries."
        fields={fields}
        initialValues={
          editing
            ? {
                academicYearId: editing.academicYearId,
                name: editing.name,
                status: editing.status === 'archived' ? 'active' : editing.status,
              }
            : { status: 'active' }
        }
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        error={formError}
        onClose={() => { setDialogOpen(false); }}
        onSubmit={handleSubmit}
      >
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Events</CardTitle>
            <CardDescription>
              Semester start/end, exams, holidays, and custom events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.map((ev, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2"
              >
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={ev.type}
                  onChange={(e) => {
                    const next = [...events];
                    next[index] = { ...ev, type: e.target.value as CalendarEventType };
                    setEvents(next);
                  }}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Title"
                  value={ev.title}
                  onChange={(e) => {
                    const next = [...events];
                    next[index] = { ...ev, title: e.target.value };
                    setEvents(next);
                  }}
                />
                <Input
                  type="date"
                  value={ev.startDate}
                  onChange={(e) => {
                    const next = [...events];
                    next[index] = { ...ev, startDate: e.target.value };
                    setEvents(next);
                  }}
                />
                <Input
                  type="date"
                  value={ev.endDate}
                  onChange={(e) => {
                    const next = [...events];
                    next[index] = { ...ev, endDate: e.target.value };
                    setEvents(next);
                  }}
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="Description (optional)"
                  value={ev.description}
                  onChange={(e) => {
                    const next = [...events];
                    next[index] = { ...ev, description: e.target.value };
                    setEvents(next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-self-start"
                  onClick={() => { setEvents(events.filter((_, i) => i !== index)); }}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setEvents([...events, emptyEvent()]); }}
            >
              Add event
            </Button>
          </CardContent>
        </Card>
      </ResourceFormDialog>
    </main>
  );
}
