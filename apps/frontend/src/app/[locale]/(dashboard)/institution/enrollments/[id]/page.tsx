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
  Skeleton,
} from '@learnova/ui';
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, UserRound, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatEnrollmentApprovalStatus,
  formatEnrollmentCompletionStatus,
  formatEnrollmentMethod,
  formatEnrollmentStatus,
  useApproveEnrollmentMutation,
  useCompleteEnrollmentMutation,
  useEnrollment,
  useRejectEnrollmentMutation,
  useWithdrawEnrollmentMutation,
} from '@/features/enrollment';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

export default function EnrollmentDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const query = useEnrollment(id);
  const enrollment = query.data;

  const approveMutation = useApproveEnrollmentMutation();
  const rejectMutation = useRejectEnrollmentMutation();
  const withdrawMutation = useWithdrawEnrollmentMutation();
  const completeMutation = useCompleteEnrollmentMutation();

  const [reason, setReason] = useState('');

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (query.isError || !enrollment) {
    return (
      <ErrorState
        message={
          query.error instanceof Error
            ? query.error.message
            : 'Failed to load enrollment details.'
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const canApprove = enrollment.approvalStatus === 'pending';
  const canReject = enrollment.approvalStatus === 'pending';
  const canWithdraw =
    enrollment.status === 'active' || enrollment.status === 'approved';
  const canComplete = enrollment.status === 'active';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={APP_ROUTES.INSTITUTION_ENROLLMENTS}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Enrollment Details</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {enrollment.enrollmentNumber}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enrolled on {enrollment.enrollmentDate.slice(0, 10)}
          </p>
        </div>
        <Badge variant="secondary" className="text-base">
          {formatEnrollmentStatus(enrollment.status)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Student information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={UserRound} label="Student ID" value={enrollment.studentId} />
            <InfoRow
              icon={Calendar}
              label="Enrollment date"
              value={enrollment.enrollmentDate.slice(0, 10)}
            />
            <InfoRow
              icon={Calendar}
              label="Method"
              value={formatEnrollmentMethod(enrollment.enrollmentMethod)}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Course information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={BookOpen} label="Course ID" value={enrollment.courseId} />
            {enrollment.facultyId ? (
              <InfoRow icon={UserRound} label="Faculty ID" value={enrollment.facultyId} />
            ) : null}
            {enrollment.sectionId ? (
              <InfoRow label="Section ID" value={enrollment.sectionId} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Academic references</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrollment.departmentId ? (
              <InfoRow label="Department ID" value={enrollment.departmentId} />
            ) : null}
            {enrollment.programId ? (
              <InfoRow label="Program ID" value={enrollment.programId} />
            ) : null}
            {enrollment.academicYearId ? (
              <InfoRow label="Academic Year ID" value={enrollment.academicYearId} />
            ) : null}
            {enrollment.semesterId ? (
              <InfoRow label="Semester ID" value={enrollment.semesterId} />
            ) : null}
            {!enrollment.departmentId &&
            !enrollment.programId &&
            !enrollment.academicYearId &&
            !enrollment.semesterId ? (
              <p className="text-sm text-muted-foreground">No references set</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Status information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label="Status"
              value={formatEnrollmentStatus(enrollment.status)}
            />
            <InfoRow
              label="Approval"
              value={formatEnrollmentApprovalStatus(enrollment.approvalStatus)}
            />
            <InfoRow
              label="Completion"
              value={formatEnrollmentCompletionStatus(enrollment.completionStatus)}
            />
            {enrollment.completionDate ? (
              <InfoRow
                icon={Calendar}
                label="Completion date"
                value={enrollment.completionDate.slice(0, 10)}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      {enrollment.notes ? (
        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {enrollment.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {enrollment.withdrawReason ? (
        <Card className="rounded-2xl border-danger/20 bg-danger/5">
          <CardHeader>
            <CardTitle className="text-base text-danger">Withdraw reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-danger/90">
              {enrollment.withdrawReason}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <PermissionGate permission={PERMISSIONS.ENROLLMENT_MANAGE}>
        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
            <CardDescription>Manage enrollment status and approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {canApprove ? (
                <Button
                  disabled={approveMutation.isPending}
                  onClick={() => void approveMutation.mutateAsync(id)}
                >
                  <CheckCircle2 className="size-4" />
                  Approve enrollment
                </Button>
              ) : null}
              {canReject ? (
                <Button
                  variant="outline"
                  disabled={rejectMutation.isPending}
                  onClick={() => {
                    const r = prompt('Rejection reason (optional):') ?? '';
                    void rejectMutation.mutateAsync({ id, reason: r });
                  }}
                >
                  <XCircle className="size-4" />
                  Reject enrollment
                </Button>
              ) : null}
              {canComplete ? (
                <Button
                  variant="outline"
                  disabled={completeMutation.isPending}
                  onClick={() => void completeMutation.mutateAsync(id)}
                >
                  Mark as completed
                </Button>
              ) : null}
              {canWithdraw ? (
                <Button
                  variant="danger"
                  disabled={withdrawMutation.isPending}
                  onClick={() => {
                    const r = prompt('Withdrawal reason (optional):') ?? '';
                    void withdrawMutation.mutateAsync({ id, reason: r });
                  }}
                >
                  Withdraw student
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </PermissionGate>

      <Card className="rounded-2xl border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Created</span>
            <span className="tabular-nums">{enrollment.createdAt.slice(0, 19).replace('T', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span>Updated</span>
            <span className="tabular-nums">{enrollment.updatedAt.slice(0, 19).replace('T', ' ')}</span>
          </div>
          {enrollment.deletedAt ? (
            <div className="flex justify-between">
              <span>Deleted</span>
              <span className="tabular-nums">{enrollment.deletedAt.slice(0, 19).replace('T', ' ')}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {Icon ? <Icon className="size-4" /> : null}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
