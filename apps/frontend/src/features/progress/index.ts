/**
 * Progress tracking feature barrel.
 */

export { progressApi } from './services/progress-api';
export {
  progressKeys,
  useMyProgress,
  useCourseProgress,
  useResumePoint,
  useBookmarks,
  useNotes,
  useActivity,
  useStudentProgressDashboard,
  useFacultyProgressDashboard,
  useInstitutionProgressDashboard,
  useProgressStats,
  useOpenLessonMutation,
  useCompleteLessonMutation,
  useUpdateLessonProgressMutation,
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useStartSessionMutation,
  useEndSessionMutation,
} from './hooks/use-progress-queries';
export { useProgressStore } from './store/progress-store';
export type { ProgressStatusFilter } from './store/progress-store';
export {
  LEARNING_STATUS_LABELS,
  BOOKMARK_TARGET_LABELS,
  ACTIVITY_TYPE_LABELS,
  formatLearningStatus,
  formatBookmarkTarget,
  formatActivityType,
  formatMinutes,
  formatPercent,
} from './lib/labels';
export { ContinueLearningCard } from './components/continue-learning-card';
export type { ContinueLearningItem } from './components/continue-learning-card';
export { ProgressStatCards } from './components/progress-stat-cards';
export type { ProgressStatItem } from './components/progress-stat-cards';
export { ActivityTimeline } from './components/activity-timeline';
export { ProgressFilters } from './components/progress-filters';
export type * from './types';
