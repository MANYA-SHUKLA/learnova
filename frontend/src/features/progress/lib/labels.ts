import type { BookmarkTargetType, LearningActivityType, LearningStatus } from '@learnova/types';

export const LEARNING_STATUS_LABELS: Record<LearningStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  paused: 'Paused',
};

export const BOOKMARK_TARGET_LABELS: Record<BookmarkTargetType, string> = {
  module: 'Module',
  lesson: 'Lesson',
  resource: 'Resource',
};

export const ACTIVITY_TYPE_LABELS: Record<LearningActivityType, string> = {
  course_started: 'Course started',
  lesson_opened: 'Lesson opened',
  lesson_completed: 'Lesson completed',
  module_completed: 'Module completed',
  course_completed: 'Course completed',
  resource_viewed: 'Resource viewed',
  resource_downloaded: 'Resource downloaded',
  bookmark_created: 'Bookmark created',
  note_created: 'Note created',
  session_started: 'Session started',
  session_ended: 'Session ended',
  lab_problem_solved: 'Practice problem solved',
  lab_completed: 'Practice lab completed',
};

export function formatLearningStatus(status: LearningStatus) {
  return LEARNING_STATUS_LABELS[status] ?? status;
}

export function formatBookmarkTarget(type: BookmarkTargetType) {
  return BOOKMARK_TARGET_LABELS[type] ?? type;
}

export function formatActivityType(type: LearningActivityType | string) {
  return ACTIVITY_TYPE_LABELS[type as LearningActivityType] ?? type.replaceAll('_', ' ');
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const rem = Math.round(minutes % 60);
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
