'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
  Spinner,
} from '@learnova/ui';
import { BookOpen, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatEnrollmentStatus,
  useLeaveWaitlistMutation,
  useMyEnrollments,
  useSelfEnrollMutation,
  useWaitlist,
  useWithdrawEnrollmentMutation,
} from '@/features/enrollment';
import { ApiClientError } from '@/lib/api/client';
import { Link } from '@/lib/i18n/routing';

export default function StudentEnrollmentsPage() {
  const t = useTranslations('dashboard.student.enrollments');
  const tCommon = useTranslations('common');
  const myQuery = useMyEnrollments();
  const waitlistQuery = useWaitlist();
  const selfEnrollMutation = useSelfEnrollMutation();
  const withdrawMutation = useWithdrawEnrollmentMutation();
  const leaveWaitlistMutation = useLeaveWaitlistMutation();

  const [courseId, setCourseId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const enrollments = myQuery.data?.data.items ?? [];
  const waitlist = waitlistQuery.data?.items ?? [];

  const onSelfEnroll = async () => {
    setError(null);
    if (!courseId.trim()) {
      setError('Course ID is required');
      return;
    }
    try {
      await selfEnrollMutation.mutateAsync({ courseId: courseId.trim() });
      setCourseId('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Self enrollment failed');
    }
  };

  return (
    <PermissionGate permission={PERMISSIONS.ENROLLMENT_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <PermissionGate permission={PERMISSIONS.ENROLLMENT_WRITE}>
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('selfEnrollTitle')}</CardTitle>
              <CardDescription>{t('selfEnrollDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              ) : null}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter course ID"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void onSelfEnroll();
                  }}
                  disabled={selfEnrollMutation.isPending}
                />
                <Button
                  onClick={() => void onSelfEnroll()}
                  disabled={selfEnrollMutation.isPending || !courseId.trim()}
                >
                  {selfEnrollMutation.isPending ? (
                    <>
                      <Spinner size="sm" />
                      Enrolling…
                    </>
                  ) : (
                    'Enroll'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </PermissionGate>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('myEnrollments')}</CardTitle>
            <CardDescription>{t('myEnrollmentsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myQuery.isError ? (
              <ErrorState
                message={
                  myQuery.error instanceof Error
                    ? myQuery.error.message
                    : 'Failed to load enrollments.'
                }
                onRetry={() => void myQuery.refetch()}
              />
            ) : null}

            {myQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : enrollments.length === 0 ? (
              <EmptyState
                illustration="inbox"
                title={t('emptyTitle')}
                description={t('emptyDescription')}
              />
            ) : (
              <div className="space-y-3">
                {enrollments.map((row) => (
                  <Card key={row.id} className="rounded-2xl">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{row.enrollmentNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.enrollmentDate.slice(0, 10)}
                          </p>
                        </div>
                        <Badge variant="secondary">{formatEnrollmentStatus(row.status)}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="size-4" />
                        <span>Course ID: {row.courseId}</span>
                      </div>
                      {row.status === 'active' || row.status === 'approved' ? (
                        <PermissionGate permission={PERMISSIONS.ENROLLMENT_WRITE}>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={withdrawMutation.isPending}
                            onClick={() => {
                              const reason = prompt('Withdrawal reason (optional):') ?? '';
                              void withdrawMutation.mutateAsync({ id: row.id, reason });
                            }}
                          >
                            <XCircle className="size-4" />
                            Withdraw
                          </Button>
                        </PermissionGate>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {waitlist.length > 0 ? (
          <Card className="rounded-2xl border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('waitlist')}</CardTitle>
              <CardDescription>{t('waitlistDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {waitlist.map((entry) => (
                <Card key={entry.id} className="rounded-2xl">
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">Course: {entry.courseId}</p>
                      <p className="text-xs text-muted-foreground">
                        Position {entry.position} · Requested {entry.requestedAt.slice(0, 10)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={leaveWaitlistMutation.isPending}
                      onClick={() => void leaveWaitlistMutation.mutateAsync(entry.courseId)}
                    >
                      Leave
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PermissionGate>
  );
}
