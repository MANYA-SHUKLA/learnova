'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { BookOpen } from 'lucide-react';
import { Link } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

export default function StudentDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Student</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Student dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome{user?.firstName ? `, ${user.firstName}` : ''}. Your courses and labs will live
          here. Student accounts are created by your institution administrator.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </span>
            <div>
              <CardTitle>Coming soon</CardTitle>
              <CardDescription>
                Learning paths, assignments, and practice labs will appear once Student modules ship.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/sessions">Manage sessions</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
