import { Spinner } from '@learnova/ui';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 bg-background">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
