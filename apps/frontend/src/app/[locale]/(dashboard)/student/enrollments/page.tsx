'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  PageHeader,
  Spinner,
} from '@learnova/ui';
import { BookOpen, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DashboardPage } from '@/components/dashboard';
import { CourseSelect } from '@/components/shared/entity-selects';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatEnrollmentStatus,
  useLeaveWaitlistMutation,
  useMyEnrollments,
  useSelfEnrollMutation,
  useWaitlist,
  useWithdrawEnrollmentMutation,
} from '@/features/enrollment';
import { ApiClientError } from '@/lib/api/client';

export default function StudentEnrollmentsPage() {
  const t = useTranslations('dashboard.student.enrollments');
  const myQuery = useMyEnrollments();
  const waitlistQuery = useWaitlist();
  const selfEnrollMutation = useSelfEnrollMutation();
  const withdrawMutation = useWithdrawEnrollmentMutation();
  const leaveWaitlistMutation = useLeaveWaitlistMutation();

  const [courseId, setCourseId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const enrollments = myQuery.data?.data.items ?? [];
  const waitlist = waitlistQuery.data?.items ?? [];
  const enrolledCourseIds = enrollments.map((row) => row.courseId);

  const onSelfEnroll = async () => {
    setError(null);
    if (!courseId.trim()) {
      setError('Please select a course');
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
      <DashboardPage>
        <PageHeader eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />

        <PermissionGate permission={PERMISSIONS.ENROLLMENT_WRITE}>
          <Card className="rounded-xl border-border/80 shadow-soft-md">
            <CardHeader>
              <CardTitle className="text-card-title">{t('selfEnrollTitle')}</CardTitle>
              <CardDescription>{t('selfEnrollDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <CourseSelect
                  className="flex-1"
                  label="Course"
                  value={courseId}
                  listParams={{ status: 'published' }}
                  excludeIds={enrolledCourseIds}
                  disabled={selfEnrollMutation.isPending}
                  onChange={setCourseId}
                />
                <Button
                  className="rounded-xl sm:mb-0.5"
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

        <Card className="directory-shell overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-card-title">{t('myEnrollments')}</CardTitle>
            <CardDescription>{t('myEnrollmentsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {myQuery.isError ? (
              <ErrorState
                message={
                  myQuery.error instanceof Error
                    ? myQuery.error.message
                    : 'Failed to load enrollments.'
                }
                onRetry={() => void myQuery.refetch()}
              />
            ) : (
              <DataTable
                caption={t('myEnrollments')}
                loading={myQuery.isLoading}
                data={enrollments}
                rowKey={(row) => row.id}
                emptyTitle={t('emptyTitle')}
                emptyDescription={t('emptyDescription')}
                columns={[
                  {
                    id: 'number',
                    header: 'Enrollment #',
                    cell: (row) => <span className="font-medium">{row.enrollmentNumber}</span>,
                  },
                  {
                    id: 'course',
                    header: 'Course',
                    cell: (row) => (
                      <span className="flex items-center gap-2 text-sm">
                        <BookOpen className="size-4 text-muted-foreground" aria-hidden />
                        {row.courseId}
                      </span>
                    ),
                  },
                  {
                    id: 'date',
                    header: 'Date',
                    cell: (row) => (
                      <span className="tabular-nums text-sm">{row.enrollmentDate.slice(0, 10)}</span>
                    ),
                  },
                  {
                    id: 'status',
                    header: 'Status',
                    cell: (row) => (
                      <Badge variant="secondary">{formatEnrollmentStatus(row.status)}</Badge>
                    ),
                  },
                ]}
                rowActions={(row) =>
                  row.status === 'active' || row.status === 'approved' ? (
                    <PermissionGate permission={PERMISSIONS.ENROLLMENT_WRITE}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
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
                  ) : null
                }
                mobileRow={(row) => (
                  <Card className="rounded-xl">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{row.enrollmentNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.enrollmentDate.slice(0, 10)}
                          </p>
                        </div>
                        <Badge variant="secondary">{formatEnrollmentStatus(row.status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Course: {row.courseId}</p>
                      {row.status === 'active' || row.status === 'approved' ? (
                        <PermissionGate permission={PERMISSIONS.ENROLLMENT_WRITE}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full rounded-xl"
                            disabled={withdrawMutation.isPending}
                            onClick={() => {
                              const reason = prompt('Withdrawal reason (optional):') ?? '';
                              void withdrawMutation.mutateAsync({ id: row.id, reason });
                            }}
                          >
                            Withdraw
                          </Button>
                        </PermissionGate>
                      ) : null}
                    </CardContent>
                  </Card>
                )}
              />
            )}
          </CardContent>
        </Card>

        {waitlist.length > 0 ? (
          <Card className="rounded-xl border-border/80 shadow-soft-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-card-title">{t('waitlist')}</CardTitle>
              <CardDescription>{t('waitlistDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                caption={t('waitlist')}
                data={waitlist}
                rowKey={(row) => row.id}
                columns={[
                  {
                    id: 'course',
                    header: 'Course',
                    cell: (row) => <span className="font-medium">{row.courseId}</span>,
                  },
                  {
                    id: 'position',
                    header: 'Position',
                    cell: (row) => <span className="tabular-nums">{row.position}</span>,
                  },
                  {
                    id: 'requested',
                    header: 'Requested',
                    cell: (row) => (
                      <span className="tabular-nums text-sm">{row.requestedAt.slice(0, 10)}</span>
                    ),
                  },
                ]}
                rowActions={(row) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg"
                    disabled={leaveWaitlistMutation.isPending}
                    onClick={() => void leaveWaitlistMutation.mutateAsync(row.courseId)}
                  >
                    Leave
                  </Button>
                )}
                mobileRow={(row) => (
                  <Card className="rounded-xl">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div>
                        <p className="font-medium">Course: {row.courseId}</p>
                        <p className="text-xs text-muted-foreground">
                          Position {row.position} · {row.requestedAt.slice(0, 10)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={leaveWaitlistMutation.isPending}
                        onClick={() => void leaveWaitlistMutation.mutateAsync(row.courseId)}
                      >
                        Leave
                      </Button>
                    </CardContent>
                  </Card>
                )}
              />
            </CardContent>
          </Card>
        ) : null}
      </DashboardPage>
    </PermissionGate>
  );
}
