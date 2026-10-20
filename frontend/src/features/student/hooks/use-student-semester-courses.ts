'use client';

import type { CourseProgress, Enrollment } from '@learnova/types';
import { useMemo } from 'react';
import { useMyEnrollments } from '@/features/enrollment';
import { useMyStudentProfile } from './use-student-queries';

const LEARNING_STATUSES = new Set<Enrollment['status']>(['active', 'approved']);

function isCurrentLearningEnrollment(row: Enrollment): boolean {
  if (!LEARNING_STATUSES.has(row.status)) return false;
  if (row.approvalStatus === 'pending' || row.approvalStatus === 'rejected') return false;
  return true;
}

export function useStudentSemesterCourses(enabled = true) {
  const profileQuery = useMyStudentProfile(enabled);
  const semesterId = profileQuery.data?.semesterId ?? null;

  const enrollmentsQuery = useMyEnrollments(
    {
      page: 1,
      limit: 200,
      sortBy: 'enrollmentDate',
      sortOrder: 'desc',
      ...(semesterId ? { semesterId } : {}),
    },
    enabled && !profileQuery.isLoading,
  );

  const enrollments = useMemo(() => {
    const items = enrollmentsQuery.data?.items ?? [];
    return items
      .filter(isCurrentLearningEnrollment)
      .filter((row) => !semesterId || !row.semesterId || row.semesterId === semesterId);
  }, [enrollmentsQuery.data, semesterId]);

  const courseIds = useMemo(
    () => new Set(enrollments.map((row) => row.courseId)),
    [enrollments],
  );

  return {
    semesterId,
    academicYearId: profileQuery.data?.academicYearId ?? null,
    enrollments,
    courseIds,
    /** When true, only courses from the student's current semester should be shown. */
    restrictsToSemester: Boolean(semesterId),
    isLoading: profileQuery.isLoading || enrollmentsQuery.isLoading,
    isError: profileQuery.isError || enrollmentsQuery.isError,
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
