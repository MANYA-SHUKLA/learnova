import type { ID } from '../common/index.js';

/** Learning journey status — not grades or attendance */
export type LearningStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';

export type LearningActivityType =
  | 'course_started'
  | 'lesson_opened'
  | 'lesson_completed'
  | 'module_completed'
  | 'course_completed'
  | 'resource_viewed'
  | 'resource_downloaded'
  | 'bookmark_created'
  | 'note_created'
  | 'session_started'
  | 'session_ended'
  | 'lab_problem_solved'
  | 'lab_completed';

export type BookmarkTargetType = 'module' | 'lesson' | 'resource';

export interface ResumePosition {
  scrollY: number | null;
  videoSeconds: number | null;
  markdownOffset: number | null;
  lastResourceId: ID | null;
}

export interface CourseProgress {
  id: ID;
  institutionId: ID;
  studentId: ID;
  courseId: ID;
  enrollmentId: ID;
  progressPercentage: number;
  status: LearningStatus;
  startedAt: string | null;
  lastAccessedAt: string | null;
  completedAt: string | null;
  estimatedRemainingMinutes: number;
  timeSpentMinutes: number;
  currentModuleId: ID | null;
  currentLessonId: ID | null;
  resumePosition: ResumePosition;
  bookmarksCount: number;
  notesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleProgress {
  id: ID;
  institutionId: ID;
  studentId: ID;
  moduleId: ID;
  courseId: ID;
  completionPercentage: number;
  status: LearningStatus;
  timeSpentMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgress {
  id: ID;
  institutionId: ID;
  studentId: ID;
  lessonId: ID;
  moduleId: ID;
  courseId: ID;
  status: LearningStatus;
  watchPercentage: number;
  readingPercentage: number;
  timeSpentSeconds: number;
  completed: boolean;
  completedAt: string | null;
  lastPosition: number;
  lastAccessedAt: string | null;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceProgress {
  id: ID;
  institutionId: ID;
  studentId: ID;
  resourceId: ID;
  lessonId: ID;
  courseId: ID;
  status: LearningStatus;
  downloaded: boolean;
  viewed: boolean;
  completed: boolean;
  timeSpentSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningBookmark {
  id: ID;
  institutionId: ID;
  studentId: ID;
  courseId: ID;
  moduleId: ID | null;
  lessonId: ID | null;
  resourceId: ID | null;
  targetType: BookmarkTargetType;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningNote {
  id: ID;
  institutionId: ID;
  studentId: ID;
  courseId: ID;
  lessonId: ID;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningActivity {
  id: ID;
  institutionId: ID;
  studentId: ID;
  courseId: ID | null;
  moduleId: ID | null;
  lessonId: ID | null;
  resourceId: ID | null;
  type: LearningActivityType;
  durationSeconds: number;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
}

export interface LearningSession {
  id: ID;
  institutionId: ID;
  studentId: ID;
  courseId: ID;
  lessonId: ID | null;
  startedAt: string;
  endedAt: string | null;
  idleSeconds: number;
  activeSeconds: number;
  totalSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProgressDashboard {
  coursesInProgress: number;
  completedCourses: number;
  hoursLearned: number;
  lessonsCompleted: number;
  modulesCompleted: number;
  bookmarks: number;
  notes: number;
  currentStreakDays: number;
  continueLearning: Array<{
    courseId: string;
    courseTitle: string;
    progressPercentage: number;
    currentModuleId: string | null;
    currentLessonId: string | null;
    estimatedRemainingMinutes: number;
  }>;
  recentActivity: LearningActivity[];
}

export interface FacultyCourseProgressAnalytics {
  courseId: string;
  averageProgress: number;
  studentsStarted: number;
  studentsCompleted: number;
  studentsInProgress: number;
  topLearners: Array<{ studentId: string; progressPercentage: number }>;
  leastActive: Array<{ studentId: string; progressPercentage: number; lastAccessedAt: string | null }>;
}

export interface InstitutionProgressAnalytics {
  totalLearningHours: number;
  courseCompletionRate: number;
  studentEngagement: number;
  byDepartment: Array<{ departmentId: string | null; label: string; averageProgress: number; count: number }>;
  byProgram: Array<{ programId: string | null; label: string; averageProgress: number; count: number }>;
  mostActiveCourses: Array<{ courseId: string; title: string; hours: number; averageProgress: number }>;
  progressTrend: Array<{ date: string; averageProgress: number; hours: number }>;
  weeklyActivity: Array<{ week: string; events: number; hours: number }>;
}

export interface ProgressStats {
  totalCourseProgress: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  paused: number;
  averageProgress: number;
  totalHours: number;
}
