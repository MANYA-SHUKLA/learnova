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
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/routing';
import { use, useState } from 'react';
import { SuccessPopup } from '@/components/shared/success-popup';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import { useCourse } from '@/features/course';
import {
  AssignmentExtendDueDialog,
  formatAssignmentStatus,
  formatAssignmentType,
  formatDueDate,
  formatSubmissionStatus,
  useArchiveAssignmentMutation,
  useAssignment,
  useCloseAssignmentMutation,
  useDeleteAssignmentMutation,
  useGradeSubmissionMutation,
  usePublishAssignmentMutation,
  useSubmissionList,
  useUpdateAssignmentMutation,
} from '@/features/assignment';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { Link } from '@/lib/i18n/routing';

type FacultyTab = 'overview' | 'submissions';

export default function FacultyAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations('dashboard.faculty.assignments');
  const tCommon = useTranslations('common');
  const [tab, setTab] = useState<FacultyTab>('overview');
  const [extendOpen, setExtendOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editing, setEditing] = useState(false);

  const assignmentQuery = useAssignment(id);
  const courseQuery = useCourse(assignmentQuery.data?.courseId ?? '', Boolean(assignmentQuery.data?.courseId));
  const submissionsQuery = useSubmissionList({ assignmentId: id, limit: 50 });
  const updateMutation = useUpdateAssignmentMutation();
  const deleteMutation = useDeleteAssignmentMutation();
  const publishMutation = usePublishAssignmentMutation();
  const closeMutation = useCloseAssignmentMutation();
  const archiveMutation = useArchiveAssignmentMutation();
  const gradeMutation = useGradeSubmissionMutation();
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(tCommon('savedSuccessfully'));

  const [gradeMarks, setGradeMarks] = useState<Record<string, string>>({});
  const [gradeFeedback, setGradeFeedback] = useState<Record<string, string>>({});

  const assignment = assignmentQuery.data;
  const submissions = submissionsQuery.data?.items ?? [];
  const course = courseQuery.data;

  const tabs: FacultyTab[] = ['overview', 'submissions'];

  const startEdit = () => {
    if (!assignment) return;
    setEditTitle(assignment.title);
    setEditInstructions(assignment.instructions ?? '');
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!assignment) return;
    await updateMutation.mutateAsync({
      id: assignment.id,
      body: {
        title: editTitle.trim(),
        instructions: editInstructions.trim() || null,
      },
    });
    setEditing(false);
    showSuccess(tCommon('savedSuccessfully'));
  };

  const handleDelete = async () => {
    if (!assignment) return;
    if (!window.confirm(t('deleteConfirm'))) return;
    await deleteMutation.mutateAsync(assignment.id);
    router.push(APP_ROUTES.FACULTY_ASSIGNMENTS);
  };

  return (
    <PermissionGate permission={PERMISSIONS.ASSIGNMENT_READ} enforce>
      <div className="space-y-6">
        <SuccessPopup open={open} message={message} onClose={closeSuccess} />

        <Button variant="ghost" asChild size="sm" className="-ml-2">
          <Link href={APP_ROUTES.FACULTY_ASSIGNMENTS}>{t('back')}</Link>
        </Button>

        {assignmentQuery.isError ? (
          <ErrorState message={t('detailError')} />
        ) : assignmentQuery.isLoading || !assignment ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    {assignment.title}
                  </h1>
                  <Badge variant="secondary">{formatAssignmentStatus(assignment.status)}</Badge>
                  <Badge variant="outline">{formatAssignmentType(assignment.assignmentType)}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {course ? `${course.courseCode} · ${course.title}` : assignment.courseId} · {t('due')}:{' '}
                  {formatDueDate(assignment.dueDate)} · {assignment.totalMarks} {t('marks')}
                </p>
              </div>
              <PermissionGate permission={PERMISSIONS.ASSIGNMENT_WRITE} fallback={null}>
                <div className="flex flex-wrap gap-2">
                  {assignment.status === 'draft' ? (
                    <Button
                      size="sm"
                      disabled={publishMutation.isPending}
                      onClick={() => void publishMutation.mutateAsync(assignment.id)}
                    >
                      {t('publish')}
                    </Button>
                  ) : null}
                  {assignment.status === 'published' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={closeMutation.isPending}
                      onClick={() => void closeMutation.mutateAsync(assignment.id)}
                    >
                      {t('close')}
                    </Button>
                  ) : null}
                  {assignment.status !== 'archived' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={archiveMutation.isPending}
                      onClick={() => void archiveMutation.mutateAsync(assignment.id)}
                    >
                      {t('archive')}
                    </Button>
                  ) : null}
                  <Button size="sm" variant="secondary" onClick={() => { setExtendOpen(true); }}>
                    {t('extend')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={startEdit}>
                    {t('edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={deleteMutation.isPending}
                    onClick={() => void handleDelete()}
                  >
                    {t('delete')}
                  </Button>
                </div>
              </PermissionGate>
            </div>

            <AssignmentExtendDueDialog
              assignment={assignment}
              open={extendOpen}
              pending={updateMutation.isPending}
              onOpenChange={setExtendOpen}
              onSave={async (dueDate, closeDate) => {
                await updateMutation.mutateAsync({
                  id: assignment.id,
                  body: { dueDate, closeDate },
                });
                setExtendOpen(false);
                showSuccess(t('extendSaved'));
              }}
            />
          </>
        )}

        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          {tabs.map((key) => (
            <Button
              key={key}
              size="sm"
              variant={tab === key ? 'default' : 'ghost'}
              onClick={() => { setTab(key); }}
            >
              {t(`tabs.${key}`)}
            </Button>
          ))}
        </div>

        {tab === 'overview' && assignment ? (
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('overviewTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {editing ? (
                <PermissionGate permission={PERMISSIONS.ASSIGNMENT_WRITE} fallback={null}>
                  <div className="space-y-3">
                    <Input value={editTitle} onChange={(e) => { setEditTitle(e.target.value); }} />
                    <textarea
                      className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      value={editInstructions}
                      onChange={(e) => { setEditInstructions(e.target.value); }}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" disabled={updateMutation.isPending} onClick={() => void saveEdit()}>
                        {tCommon('save')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(false); }}>
                        {t('cancel')}
                      </Button>
                    </div>
                  </div>
                </PermissionGate>
              ) : (
                <>
                  {assignment.description ? <p>{assignment.description}</p> : null}
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {assignment.instructions ?? t('noInstructions')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : null}

        {tab === 'submissions' ? (
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('submissionsTitle')}</CardTitle>
              <CardDescription>{t('submissionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {submissionsQuery.isLoading ? (
                <Skeleton className="h-20 w-full rounded-xl" />
              ) : submissions.length === 0 ? (
                <EmptyState
                  illustration="inbox"
                  title={t('noSubmissionsTitle')}
                  description={t('noSubmissionsDescription')}
                />
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="space-y-2 rounded-xl border border-border/80 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline">{formatSubmissionStatus(sub.status)}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {t('studentId')}: {sub.studentId} · #{sub.attemptNumber}
                      </span>
                    </div>
                    {sub.textSubmission ? (
                      <p className="line-clamp-3 text-sm text-muted-foreground">{sub.textSubmission}</p>
                    ) : null}
                    {sub.status === 'submitted' || sub.status === 'late' ? (
                      <PermissionGate permission={PERMISSIONS.ASSIGNMENT_WRITE} fallback={null}>
                        <Input
                          type="number"
                          placeholder={t('marksPlaceholder')}
                          value={gradeMarks[sub.id] ?? ''}
                          onChange={(e) =>
                            { setGradeMarks((prev) => ({ ...prev, [sub.id]: e.target.value })); }
                          }
                        />
                        <Input
                          placeholder={t('feedbackPlaceholder')}
                          value={gradeFeedback[sub.id] ?? ''}
                          onChange={(e) =>
                            { setGradeFeedback((prev) => ({ ...prev, [sub.id]: e.target.value })); }
                          }
                        />
                        <Button
                          size="sm"
                          disabled={gradeMutation.isPending || !gradeMarks[sub.id]}
                          onClick={() =>
                            void gradeMutation.mutateAsync({
                              id: sub.id,
                              body: {
                                gradingMethod: 'marks',
                                marksObtained: Number(gradeMarks[sub.id]),
                                feedback: gradeFeedback[sub.id]?.trim() || t('gradedDefaultFeedback'),
                              },
                            })
                          }
                        >
                          {t('grade')}
                        </Button>
                      </PermissionGate>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PermissionGate>
  );
}
