import { Spinner } from '@learnova/ui';

interface SessionLoadingShellProps {
  message?: string;
  className?: string;
}

export function SessionLoadingShell({
  message = 'Loading…',
  className = 'min-h-[50vh]',
}: SessionLoadingShellProps) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-3 bg-background ${className}`}
    >
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
