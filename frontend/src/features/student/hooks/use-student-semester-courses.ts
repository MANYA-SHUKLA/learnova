'use client';

import type { CourseProgress, Enrollment } from '@learnova/types';
import { useMemo } from 'react';
import { useCourseList } from '@/features/course';
import { useMyEnrollments } from '@/features/enrollment';
import { useMyStudentProfile } from './use-student-queries';

const LEARNING_STATUSES = new Set<Enrollment['status']>(['active', 'approved']);

function isCurrentLearningEnrollment(row: Enrollment): boolean {
  if (!LEARNING_STATUSES.has(row.status)) return false;
  if (row.approvalStatus === 'pending' || row.approvalStatus === 'rejected') return false;
  return true;
}

function enrollmentMatchesStudentTerm(
  row: Enrollment,
  semesterId: string | null,
  programId: string | null,
  catalogCourseIds: Set<string>,
): boolean {
  if (!semesterId) return true;
  if (row.semesterId === semesterId) return true;
  if (catalogCourseIds.size > 0 && catalogCourseIds.has(row.courseId)) return true;
  if (!row.semesterId && programId && row.programId === programId) return true;
  if (!row.semesterId && catalogCourseIds.size === 0) return true;
  return false;
}

export function useStudentSemesterCourses(enabled = true) {
  const profileQuery = useMyStudentProfile(enabled);
  const semesterId = profileQuery.data?.semesterId ?? null;
  const programId = profileQuery.data?.programId ?? null;
  const profileReady = enabled && !profileQuery.isLoading;

  const enrollmentsQuery = useMyEnrollments(
    {
      page: 1,
      limit: 200,
      sortBy: 'enrollmentDate',
      sortOrder: 'desc',
    },
    profileReady,
  );

  const catalogQuery = useCourseList(
    {
      page: 1,
      limit: 200,
      status: 'published',
      ...(programId ? { programId } : {}),
      ...(semesterId ? { semesterId } : {}),
    },
    profileReady && Boolean(semesterId),
  );

  const catalogCourseIds = useMemo(
    () => new Set((catalogQuery.data?.items ?? []).map((course) => course.id)),
    [catalogQuery.data?.items],
  );

  const enrollments = useMemo(() => {
    const items = enrollmentsQuery.data?.items ?? [];
    return items
      .filter(isCurrentLearningEnrollment)
      .filter((row) =>
        enrollmentMatchesStudentTerm(row, semesterId, programId, catalogCourseIds),
      );
  }, [enrollmentsQuery.data, semesterId, programId, catalogCourseIds]);

  const courseIds = useMemo(
    () => new Set(enrollments.map((row) => row.courseId)),
    [enrollments],
  );

  return {
    semesterId,
    programId,
    academicYearId: profileQuery.data?.academicYearId ?? null,
    enrollments,
    courseIds,
    catalogCourseIds,
    /** When true, only courses from the student's current semester should be shown. */
    restrictsToSemester: Boolean(semesterId),
    isLoading:
      profileQuery.isLoading ||
      enrollmentsQuery.isLoading ||
      (Boolean(semesterId) && catalogQuery.isLoading),
    isError: profileQuery.isError || enrollmentsQuery.isError || catalogQuery.isError,
    refetchEnrollments: enrollmentsQuery.refetch,
  };
}

export function filterByStudentSemesterCourses<T extends { courseId: string }>(
  items: T[],
  courseIds: Set<string>,
  restrict: boolean,
): T[] {
  if (!restrict) return items;
  if (courseIds.size === 0) return [];
  return items.filter((item) => courseIds.has(item.courseId));
}

/** Course picker rows: semester enrollments, with progress when available. */
export function semesterCoursePickerRows(
  enrollments: Enrollment[],
  progressItems: CourseProgress[],
): CourseProgress[] {
  const progressByCourseId = new Map(progressItems.map((row) => [row.courseId, row]));
  return enrollments.map((enrollment) => {
    const existing = progressByCourseId.get(enrollment.courseId);
    if (existing) return existing;
    return {
      id: enrollment.id,
      institutionId: enrollment.institutionId,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      enrollmentId: enrollment.id,
      progressPercentage: 0,
      status: 'not_started',
      startedAt: null,
      lastAccessedAt: null,
      completedAt: null,
      estimatedRemainingMinutes: 0,
      timeSpentMinutes: 0,
      currentModuleId: null,
      currentLessonId: null,
      resumePosition: {
        scrollY: null,
        videoSeconds: null,
        markdownOffset: null,
        lastResourceId: null,
      },
      bookmarksCount: 0,
      notesCount: 0,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  });
}
