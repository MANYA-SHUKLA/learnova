'use client';

import { Button } from '@learnova/ui';
import type { BookmarkTargetType, LearningBookmark } from '@learnova/types';
import { Bookmark } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { findBookmarkForTarget } from '../lib/bookmark-match';
import {
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
} from '../hooks/use-progress-queries';

interface BookmarkTargetButtonProps {
  courseId: string;
  targetType: BookmarkTargetType;
  moduleId?: string;
  lessonId?: string;
  resourceId?: string;
  bookmarks: LearningBookmark[];
  size?: 'sm' | 'default';
  variant?: 'outline' | 'ghost' | 'secondary';
}

export function BookmarkTargetButton({
  courseId,
  targetType,
  moduleId,
  lessonId,
  resourceId,
  bookmarks,
  size = 'sm',
  variant = 'outline',
}: BookmarkTargetButtonProps) {
  const t = useTranslations('dashboard.student.progress.bookmarks');
  const createMutation = useCreateBookmarkMutation();
  const deleteMutation = useDeleteBookmarkMutation();

  const existing = findBookmarkForTarget(bookmarks, {
    targetType,
    moduleId,
    lessonId,
    resourceId,
  });
  const pending = createMutation.isPending || deleteMutation.isPending;

  const onClick = async () => {
    if (existing) {
      await deleteMutation.mutateAsync(existing.id);
      return;
    }
    await createMutation.mutateAsync({
      courseId,
      targetType,
      moduleId,
      lessonId,
      resourceId,
    });
  };

  return (
    <Button
      type="button"
      size={size}
      variant={existing ? 'secondary' : variant}
      disabled={pending}
      onClick={() => void onClick()}
      aria-pressed={Boolean(existing)}
    >
      <Bookmark className={existing ? 'size-3.5 fill-current' : 'size-3.5'} />
      {existing ? t('bookmarked') : t('bookmark')}
    </Button>
  );
}
