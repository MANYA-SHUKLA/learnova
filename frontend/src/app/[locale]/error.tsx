'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@learnova/ui';
import { useEffect } from 'react';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-lg rounded-2xl shadow-soft-md">
        <CardHeader className="text-center">
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            The page failed to load. Try refreshing or return to your dashboard.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => reset()}>
              Try again
            </Button>
            <Button type="button" variant="outline" onClick={() => window.location.assign('/')}>
              Go home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
