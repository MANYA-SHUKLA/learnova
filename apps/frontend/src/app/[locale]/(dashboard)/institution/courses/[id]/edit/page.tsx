'use client';

import { Skeleton } from '@learnova/ui';
import { useParams } from 'next/navigation';
import { CourseForm } from '@/features/course/components/course-form';
import { useCourse } from '@/features/course';
import { ErrorState } from '@/features/institution';

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useCourse(id);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        message={query.error instanceof Error ? query.error.message : 'Course not found.'}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return <CourseForm mode="edit" initial={query.data} />;
}
