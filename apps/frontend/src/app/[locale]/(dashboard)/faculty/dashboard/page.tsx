'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { GraduationCap } from 'lucide-react';
import { Link } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

export default function FacultyDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Faculty</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Faculty dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome{user?.firstName ? `, ${user.firstName}` : ''}. Teaching tools arrive in a later
          module — accounts are provisioned by your institution, never via public signup.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <CardTitle>Coming soon</CardTitle>
              <CardDescription>
                Courses, labs, and grading workspaces will appear here after Faculty Management ships.
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
