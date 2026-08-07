/**
 * Progress API client — relative to NEXT_PUBLIC_API_URL (/api/v1).
 */

import { API_ROUTES, PAGINATION } from '@learnova/constants';
import type {
  FacultyCourseProgressAnalytics,
  InstitutionProgressAnalytics,
  LearningBookmark,
  LearningNote,
  LearningSession,
  LessonProgress,
  ProgressStats,
  StudentProgressDashboard,
} from '@learnova/types';
import { apiClient } from '@/lib/api/client';
import type {
  ActivityListParams,
  ActivityListResult,
  BookmarkListParams,
  BookmarkListResult,
  CompleteLessonBody,
  CourseProgressDetail,
  CreateBookmarkBody,
  CreateNoteBody,
  NoteListParams,
  NoteListResult,
  OpenLessonBody,
  ProgressListParams,
  ProgressListResult,
  ResumePoint,
  UpdateLessonProgressBody,
  UpdateNoteBody,
} from '../types';

const emptyMeta = (page?: number, limit?: number) => ({
  page: page ?? PAGINATION.DEFAULT_PAGE,
  limit: limit ?? PAGINATION.DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

const base = API_ROUTES.PROGRESS;

export const progressApi = {
  listMine: async (params: ProgressListParams = {}): Promise<ProgressListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: ProgressListResult['items'] }>(
      `${base}/me${toQuery({
        q: params.q,
        status: params.status,
        courseId: params.courseId,
        studentId: params.studentId,
        bookmarked: params.bookmarked,
        recent: params.recent,
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      })}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  getCourse: (courseId: string) =>
    apiClient.get<CourseProgressDetail>(`${base}/course/${courseId}`),

  getResume: (courseId: string) => apiClient.get<ResumePoint>(`${base}/resume/${courseId}`),

  openLesson: (body: OpenLessonBody) =>
    apiClient.post<LessonProgress>(`${base}/lessons/open`, body),

  completeLesson: (body: CompleteLessonBody) =>
    apiClient.post<LessonProgress>(`${base}/lessons/complete`, body),

  updateLesson: (body: UpdateLessonProgressBody) =>
    apiClient.patch<LessonProgress>(`${base}/lessons`, body),

  startSession: (body: { courseId: string; lessonId?: string }) =>
    apiClient.post<LearningSession>(`${base}/sessions/start`, body),

  endSession: (body: { sessionId: string; idleSeconds: number; activeSeconds?: number }) =>
    apiClient.post<LearningSession>(`${base}/sessions/end`, body),

  listBookmarks: async (params: BookmarkListParams = {}): Promise<BookmarkListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: LearningBookmark[] }>(
      `${base}/bookmarks${toQuery({
        q: params.q,
        courseId: params.courseId,
        targetType: params.targetType,
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      })}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  createBookmark: (body: CreateBookmarkBody) =>
    apiClient.post<LearningBookmark>(`${base}/bookmarks`, body),

  deleteBookmark: (id: string) => apiClient.delete<LearningBookmark>(`${base}/bookmarks/${id}`),

  listNotes: async (params: NoteListParams = {}): Promise<NoteListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: LearningNote[] }>(
      `${base}/notes${toQuery({
        q: params.q,
        courseId: params.courseId,
        lessonId: params.lessonId,
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      })}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  createNote: (body: CreateNoteBody) => apiClient.post<LearningNote>(`${base}/notes`, body),

  updateNote: (id: string, body: UpdateNoteBody) =>
    apiClient.patch<LearningNote>(`${base}/notes/${id}`, body),

  deleteNote: (id: string) => apiClient.delete<LearningNote>(`${base}/notes/${id}`),

  exportNotes: (params?: { format?: 'csv' | 'json'; courseId?: string }) =>
    apiClient.get<{ items: LearningNote[] } | string>(
      `${base}/notes/export${toQuery({
        format: params?.format,
        courseId: params?.courseId,
      })}`,
    ),

  listActivity: async (params: ActivityListParams = {}): Promise<ActivityListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: ActivityListResult['items'] }>(
      `${base}/activity${toQuery({
        courseId: params.courseId,
        studentId: params.studentId,
        type: params.type,
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      })}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(params.page, params.limit) };
  },

  studentDashboard: () => apiClient.get<StudentProgressDashboard>(`${base}/dashboard/student`),

  facultyDashboard: (courseId: string) =>
    apiClient.get<FacultyCourseProgressAnalytics>(
      `${base}/dashboard/faculty${toQuery({ courseId })}`,
    ),

  institutionDashboard: () =>
    apiClient.get<InstitutionProgressAnalytics>(`${base}/dashboard/institution`),

  stats: () => apiClient.get<ProgressStats>(`${base}/stats`),

  search: async (q: string, page = 1, limit = 20): Promise<ProgressListResult> => {
    const { data, meta } = await apiClient.getWithMeta<{ items: ProgressListResult['items'] }>(
      `${base}/search${toQuery({ q, page, limit })}`,
    );
    return { items: data.items, meta: meta ?? emptyMeta(page, limit) };
  },
};
