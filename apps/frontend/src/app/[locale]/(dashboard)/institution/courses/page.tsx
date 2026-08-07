'use client';

import { useCourseList } from '@/features/course';
import { Skeleton } from '@learnova/ui';

export default function CoursesListPage() {
  const { data, isLoading } = useCourseList();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and manage institution courses
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {data?.items?.length ? `${data.items.length} courses found` : 'No courses yet'}
        </p>
        {data?.items?.length ? (
          <ul className="mt-4 space-y-2">
            {data.items.map((course) => (
              <li key={course.id} className="rounded-lg border border-border p-4">
                <h3 className="font-medium">{course.title}</h3>
                <p className="text-sm text-muted-foreground">{course.courseCode}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
