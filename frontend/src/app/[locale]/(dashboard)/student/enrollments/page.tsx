'use client';

import { PAGINATION, PERMISSIONS } from '@learnova/constants';
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
} from '@learnova/ui';
import { BookOpen, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DashboardPage } from '@/components/dashboard';
import { PermissionGate } from '@/components/shared/protected-route';
import { displayName, ErrorState } from '@/features/institution';
import { useCourseList } from '@/features/course';
import {
  formatEnrollmentStatus,
  useLeaveWaitlistMutation,
  useWaitlist,
  useWithdrawEnrollmentMutation,
} from '@/features/enrollment';
import { useStudentSemesterCourses } from '@/features/student';

export default function StudentEnrollmentsPage() {
  const t = useTranslations('dashboard.student.enrollments');
  const semesterCourses = useStudentSemesterCourses();
  const coursesQuery = useCourseList({
    page: 1,
    limit: PAGINATION.MAX_LIMIT,
    status: 'published',
    ...(semesterCourses.programId ? { programId: semesterCourses.programId } : {}),
    ...(semesterCourses.semesterId ? { semesterId: semesterCourses.semesterId } : {}),
  });
  const courseLabel = (id: string) =>
    displayName(
      coursesQuery.data?.items,
      id,
      (course) => `${course.courseCode} — ${course.title}`,
    ) ?? '—';
  const waitlistQuery = useWaitlist();
  const withdrawMutation = useWithdrawEnrollmentMutation();
  const leaveWaitlistMutation = useLeaveWaitlistMutation();

  const enrollments = semesterCourses.enrollments;
  const waitlist = waitlistQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.ENROLLMENT_READ} enforce>
      <DashboardPage>
        <PageHeader eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />

        <Card className="directory-shell overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-card-title">{t('myEnrollments')}</CardTitle>
            <CardDescription>{t('myEnrollmentsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {semesterCourses.isError ? (
              <ErrorState
                message="Failed to load enrollments."
                onRetry={() => void semesterCourses.refetchEnrollments()}
              />
            ) : (
              <DataTable
                caption={t('myEnrollments')}
                loading={semesterCourses.isLoading}
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
                        {courseLabel(row.courseId)}
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
                      <p className="text-sm text-muted-foreground">Course: {courseLabel(row.courseId)}</p>
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
                    cell: (row) => <span className="font-medium">{courseLabel(row.courseId)}</span>,
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
                        <p className="font-medium">{courseLabel(row.courseId)}</p>
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
