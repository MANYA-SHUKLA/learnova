'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
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
import { Bookmark, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatBookmarkTarget,
  useBookmarks,
  useDeleteBookmarkMutation,
} from '@/features/progress';
import { Link } from '@/lib/i18n/routing';

export default function StudentBookmarksPage() {
  const t = useTranslations('dashboard.student.progress.bookmarks');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  const params = useMemo(
    () => ({
      q: search || undefined,
      page: 1,
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    }),
    [search],
  );

  const listQuery = useBookmarks(params);
  const deleteMutation = useDeleteBookmarkMutation();
  const items = listQuery.data?.items ?? [];

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
                onChange={(e) => { setQ(e.target.value); }}
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
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
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
                  return (
                    <Card key={item.id} className="rounded-2xl">
                      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Bookmark className="size-4 text-primary" />
                            <p className="font-medium">{item.courseId}</p>
                            <Badge variant="secondary">
                              {formatBookmarkTarget(item.targetType)}
                            </Badge>
                          </div>
                          {item.note ? (
                            <p className="text-sm text-muted-foreground">{item.note}</p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            {item.createdAt.slice(0, 10)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={href}>{t('open')}</Link>
                          </Button>
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
