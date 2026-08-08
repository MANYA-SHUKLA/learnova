'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gradebookApi, type GradebookListParams } from '../services/gradebook-api';

export const gradebookKeys = {
  all: ['gradebook'] as const,
  lists: () => [...gradebookKeys.all, 'list'] as const,
  list: (params: GradebookListParams) => [...gradebookKeys.lists(), params] as const,
  courseEntries: (courseId: string, studentId?: string) =>
    [...gradebookKeys.all, 'course', courseId, 'entries', studentId] as const,
  courseSummaries: (courseId: string, studentId?: string) =>
    [...gradebookKeys.all, 'course', courseId, 'summaries', studentId] as const,
  weightScheme: (courseId: string) => [...gradebookKeys.all, 'weight', courseId] as const,
  institutionDash: (courseId?: string) =>
    [...gradebookKeys.all, 'dash', 'institution', courseId] as const,
  facultyDash: (courseId: string) => [...gradebookKeys.all, 'dash', 'faculty', courseId] as const,
  studentDash: () => [...gradebookKeys.all, 'dash', 'student'] as const,
  pendingProjects: (courseId: string) =>
    [...gradebookKeys.all, 'pending-projects', courseId] as const,
};

export function useGradebookList(params: GradebookListParams = {}, enabled = true) {
  return useQuery({
    queryKey: gradebookKeys.list(params),
    queryFn: () => gradebookApi.listEntries(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useCourseGradebookEntries(courseId: string, studentId?: string, enabled = true) {
  return useQuery({
    queryKey: gradebookKeys.courseEntries(courseId, studentId),
    queryFn: () => gradebookApi.courseEntries(courseId, studentId),
    enabled: enabled && Boolean(courseId),
    staleTime: 30_000,
  });
}

export function useCourseGradeSummaries(courseId: string, studentId?: string, enabled = true) {
  return useQuery({
    queryKey: gradebookKeys.courseSummaries(courseId, studentId),
    queryFn: () => gradebookApi.courseSummaries(courseId, studentId),
    enabled: enabled && Boolean(courseId),
    staleTime: 30_000,
  });
}

export function useInstitutionGradebookDashboard(courseId?: string, enabled = true) {
  return useQuery({
    queryKey: gradebookKeys.institutionDash(courseId),
    queryFn: () => gradebookApi.institutionDashboard(courseId),
    enabled,
    staleTime: 60_000,
  });
}

export function useFacultyGradebookDashboard(courseId: string, enabled = true) {
  return useQuery({
    queryKey: gradebookKeys.facultyDash(courseId),
    queryFn: () => gradebookApi.facultyDashboard(courseId),
    enabled: enabled && Boolean(courseId),
    staleTime: 60_000,
  });
}

export function useStudentGradebookDashboard(enabled = true) {
  return useQuery({
    queryKey: gradebookKeys.studentDash(),
    queryFn: () => gradebookApi.studentDashboard(),
    enabled,
    staleTime: 60_000,
  });
}

export function useSyncCourseGradebookMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => gradebookApi.syncCourse(courseId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: gradebookKeys.all }),
  });
}

export function useFinalizeCourseGradesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => gradebookApi.finalizeCourse(courseId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: gradebookKeys.all }),
  });
}

export function useAcademicPolicyQuery(enabled = true) {
  return useQuery({
    queryKey: [...gradebookKeys.all, 'policy'] as const,
    queryFn: () => gradebookApi.academicPolicy(),
    enabled,
    staleTime: 60_000,
  });
}

export function useUpsertAcademicPolicyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => gradebookApi.upsertAcademicPolicy(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: gradebookKeys.all }),
  });
}

export function useSubmitModerationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, notes }: { courseId: string; notes?: string }) =>
      gradebookApi.submitModeration(courseId, notes),
    onSuccess: () => void qc.invalidateQueries({ queryKey: gradebookKeys.all }),
  });
}

export function useApproveModerationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, notes }: { courseId: string; notes?: string }) =>
      gradebookApi.approveModeration(courseId, notes),
    onSuccess: () => void qc.invalidateQueries({ queryKey: gradebookKeys.all }),
  });
}

export function usePublishModerationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, notes }: { courseId: string; notes?: string }) =>
      gradebookApi.publishModeration(courseId, notes),
    onSuccess: () => void qc.invalidateQueries({ queryKey: gradebookKeys.all }),
  });
}

export function useAcademicStandingQuery(params?: { studentId?: string; semesterId?: string }) {
  return useQuery({
    queryKey: [...gradebookKeys.all, 'standing', params] as const,
    queryFn: () => gradebookApi.listStanding(params),
    staleTime: 30_000,
  });
}

export function useComputeStandingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: { studentId?: string; semesterId?: string }) =>
      gradebookApi.computeStanding(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: gradebookKeys.all }),
  });
}

export function useTranscriptRequestsQuery(params?: { status?: string }) {
  return useQuery({
    queryKey: [...gradebookKeys.all, 'transcript-requests', params] as const,
    queryFn: () => gradebookApi.listTranscriptRequests(params),
    staleTime: 30_000,
  });
}

export function useReviewTranscriptRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      requestId: string;
      status: 'approved' | 'rejected' | 'completed';
      reviewNotes?: string | null;
    }) => gradebookApi.reviewTranscriptRequest(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: gradebookKeys.all }),
  });
}
