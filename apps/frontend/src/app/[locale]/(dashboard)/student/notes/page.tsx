'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
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
import { NotebookPen, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  useDeleteNoteMutation,
  useNotes,
  useUpdateNoteMutation,
} from '@/features/progress';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

export default function StudentNotesPage() {
  const t = useTranslations('dashboard.student.progress.notes');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const params = useMemo(
    () => ({
      q: search || undefined,
      page: 1,
      limit: 50,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const,
    }),
    [search],
  );

  const listQuery = useNotes(params);
  const updateMutation = useUpdateNoteMutation();
  const deleteMutation = useDeleteNoteMutation();
  const items = listQuery.data?.items ?? [];

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setDraft(text);
  };

  const saveEdit = async () => {
    if (!editingId || !draft.trim()) return;
    await updateMutation.mutateAsync({ id: editingId, body: { text: draft.trim() } });
    setEditingId(null);
    setDraft('');
  };

  return (
    <PermissionGate permission={PERMISSIONS.PROGRESS_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('directory')}</CardTitle>
            <CardDescription>{t('directoryDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t('searchPlaceholder')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSearch(q.trim());
                }}
              />
            </div>

            {listQuery.isError ? (
              <ErrorState
                message={
                  listQuery.error instanceof Error ? listQuery.error.message : t('loadError')
                }
                onRetry={() => void listQuery.refetch()}
              />
            ) : null}

            {listQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                illustration="inbox"
                title={t('emptyTitle')}
                description={t('emptyDescription')}
              />
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const href = APP_ROUTES.STUDENT_PROGRESS_COURSE.replace(':id', item.courseId);
                  const editing = editingId === item.id;
                  return (
                    <Card key={item.id} className="rounded-2xl">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <NotebookPen className="size-4 text-primary" />
                            <p className="text-sm font-medium">{item.courseId}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.updatedAt.slice(0, 10)}
                          </p>
                        </div>
                        {editing ? (
                          <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={4}
                            className={cn(
                              'flex min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm',
                              'shadow-sm transition-colors placeholder:text-muted-foreground',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              'disabled:cursor-not-allowed disabled:opacity-50',
                            )}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-sm text-foreground/90">
                            {item.text}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={href}>{t('open')}</Link>
                          </Button>
                          {editing ? (
                            <>
                              <Button
                                size="sm"
                                disabled={updateMutation.isPending || !draft.trim()}
                                onClick={() => void saveEdit()}
                              >
                                {t('save')}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingId(null);
                                  setDraft('');
                                }}
                              >
                                {t('cancel')}
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(item.id, item.text)}
                            >
                              {t('edit')}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={deleteMutation.isPending}
                            onClick={() => void deleteMutation.mutateAsync(item.id)}
                          >
                            <Trash2 className="size-4" />
                            {t('remove')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
