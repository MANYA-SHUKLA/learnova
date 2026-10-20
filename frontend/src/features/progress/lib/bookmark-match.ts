import type { BookmarkTargetType, LearningBookmark } from '@learnova/types';

export function findBookmarkForTarget(
  items: LearningBookmark[],
  target: {
    targetType: BookmarkTargetType;
    moduleId?: string | null;
    lessonId?: string | null;
    resourceId?: string | null;
  },
): LearningBookmark | undefined {
  return items.find((item) => {
    if (item.targetType !== target.targetType) return false;
    if (target.targetType === 'module') {
      return item.moduleId === target.moduleId;
    }
    if (target.targetType === 'lesson') {
      return item.lessonId === target.lessonId;
    }
    if (target.targetType === 'resource') {
      return item.resourceId === target.resourceId;
    }
    return false;
  });
}
