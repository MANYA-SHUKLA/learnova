/**
 * Loading skeletons for builder UI
 */

import { Skeleton } from '@learnova/ui';

export function BuilderSidebarSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="ml-4 h-8 w-2/3" />
      <Skeleton className="ml-4 h-8 w-2/3" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="ml-4 h-8 w-2/3" />
      <Skeleton className="h-8 w-3/4" />
    </div>
  );
}

export function BuilderEditorSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function BuilderPropertiesSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
