'use client';

import { APP_ROUTES } from '@learnova/constants';
import type { LearningBookmark } from '@learnova/types';
import { Badge, Button, Card, CardContent } from '@learnova/ui';
import { Bookmark, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { formatBookmarkTarget } from '../lib/labels';
import { resolveBookmarkTargetLabel } from '../lib/bookmark-match';
import { useCourseProgressForCourses } from '../hooks/use-progress-queries';
import type { CourseProgressDetail } from '../types';

interface StudentBookmarksListProps {
  items: LearningBookmark[];
  courseLabel: (courseId: string) => string;
  onRemove: (id: string) => void;
  removePending: boolean;
}

export function StudentBookmarksList({
  items,
  courseLabel,
  onRemove,
  removePending,
}: StudentBookmarksListProps) {
  const t = useTranslations('dashboard.student.progress.bookmarks');
  const courseIds = useMemo(() => items.map((item) => item.courseId), [items]);
  const courseQueries = useCourseProgressForCourses(courseIds);

  const detailByCourseId = useMemo(() => {
    const map = new Map<string, CourseProgressDetail>();
    const uniqueIds = [...new Set(courseIds)];
    uniqueIds.forEach((courseId, index) => {
      const data = courseQueries[index]?.data;
      if (data) map.set(courseId, data);
    });
    return map;
  }, [courseIds, courseQueries]);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const href = APP_ROUTES.STUDENT_PROGRESS_COURSE.replace(':id', item.courseId);
        const targetLabel = resolveBookmarkTargetLabel(item, detailByCourseId.get(item.courseId));
        return (
          <Card key={item.id} className="rounded-2xl">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Bookmark className="size-4 shrink-0 text-primary" />
                  <p className="font-medium">{courseLabel(item.courseId)}</p>
                  <Badge variant="secondary">{formatBookmarkTarget(item.targetType)}</Badge>
                </div>
                {targetLabel ? (
                  <p className="text-sm text-foreground/90">{targetLabel}</p>
                ) : null}
                {item.note ? (
                  <p className="text-sm text-muted-foreground">{item.note}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">{item.createdAt.slice(0, 10)}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={href}>{t('open')}</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={removePending}
                  onClick={() => onRemove(item.id)}
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
  );
}
