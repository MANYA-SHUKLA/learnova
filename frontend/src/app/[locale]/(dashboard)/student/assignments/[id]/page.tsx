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
import { useTranslations } from 'next-intl';
import { use, useEffect, useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatAssignmentType,
  formatDueDate,
  formatSubmissionStatus,
  useAddCommentMutation,
  useAssignment,
  useAssignmentComments,
  useSaveDraftMutation,
  useSubmissionList,
  useSubmitAssignmentMutation,
} from '@/features/assignment';
import { Link } from '@/lib/i18n/routing';

export default function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('dashboard.student.assignmentDetail');
  const tList = useTranslations('dashboard.student.assignments');
  const [text, setText] = useState('');
  const [comment, setComment] = useState('');

  const assignmentQuery = useAssignment(id);
  const submissionsQuery = useSubmissionList({
    assignmentId: id,
    page: 1,
    limit: 5,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const commentsQuery = useAssignmentComments(id);
  const saveDraft = useSaveDraftMutation();
  const submit = useSubmitAssignmentMutation();
  const addComment = useAddCommentMutation();

  const assignment = assignmentQuery.data;
  const comments = commentsQuery.data?.items ?? [];

  const latestSubmission = useMemo(() => {
    const items = submissionsQuery.data?.items ?? [];
    if (items.length === 0) return null;
    return items[0] ?? null;
  }, [submissionsQuery.data?.items]);

  const isLocked = latestSubmission?.status === 'graded';

  useEffect(() => {
    if (latestSubmission?.textSubmission != null) {
      setText(latestSubmission.textSubmission);
    }
  }, [latestSubmission?.id, latestSubmission?.textSubmission]);

  return (
    <PermissionGate permission={PERMISSIONS.ASSIGNMENT_WRITE} enforce>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link href={APP_ROUTES.STUDENT_ASSIGNMENTS}>{t('back')}</Link>
          </Button>
          {assignmentQuery.isLoading ? (
            <Skeleton className="h-10 w-2/3" />
          ) : assignmentQuery.isError || !assignment ? (
            <ErrorState message={t('error')} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {assignment.title}
                </h1>
                <Badge variant="outline">{formatAssignmentType(assignment.assignmentType)}</Badge>
                {latestSubmission ? (
                  <Badge variant="secondary">{formatSubmissionStatus(latestSubmission.status)}</Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('due')}: {formatDueDate(assignment.dueDate)} · {assignment.totalMarks}{' '}
                {t('marks')}
                {assignment.myMarksObtained != null
                  ? ` · ${tList('yourGrade')}: ${assignment.myMarksObtained}/${assignment.totalMarks}`
                  : ''}
              </p>
              {assignment.myGradeFeedback ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('facultyFeedback')}: {assignment.myGradeFeedback}
                </p>
              ) : null}
            </>
          )}
        </div>

        {assignment ? (
          <>
            <Card className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base">{t('instructions')}</CardTitle>
                <CardDescription>{assignment.description ?? t('noDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {assignment.instructions ?? t('noInstructions')}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base">{t('submitTitle')}</CardTitle>
                <CardDescription>
                  {isLocked ? t('submitLockedDescription') : t('submitDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                  rows={8}
                  value={text}
                  readOnly={isLocked}
                  disabled={isLocked}
                  onChange={(e) => { setText(e.target.value); }}
                  placeholder={t('textPlaceholder')}
                />
                {isLocked ? (
                  <p className="text-sm text-muted-foreground">{t('submitLockedHint')}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={saveDraft.isPending || !text.trim()}
                      onClick={() =>
                        void saveDraft.mutateAsync({
                          assignmentId: id,
                          submissionType: 'text',
                          textSubmission: text,
                        })
                      }
                    >
                      {t('saveDraft')}
                    </Button>
                    <Button
                      disabled={submit.isPending || !text.trim()}
                      onClick={() =>
                        void submit.mutateAsync({
                          assignmentId: id,
                          submissionType: 'text',
                          textSubmission: text,
                        })
                      }
                    >
                      {t('submit')}
                    </Button>
                  </div>
                )}
                {submit.isSuccess && !isLocked ? (
                  <p className="text-sm text-primary">{t('submitSuccess')}</p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base">{t('commentsTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.length === 0 ? (
                  <EmptyState
                    illustration="inbox"
                    title={t('noComments')}
                    description={t('noCommentsDescription')}
                  />
                ) : (
                  <ul className="space-y-3">
                    {comments.map((c) => (
                      <li key={c.id} className="rounded-xl border border-border/80 p-3 text-sm">
                        <p className="text-xs text-muted-foreground">
                          {c.authorRole} · {new Date(c.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                  value={comment}
                  onChange={(e) => { setComment(e.target.value); }}
                  placeholder={t('commentPlaceholder')}
                />
                <Button
                  size="sm"
                  disabled={addComment.isPending || !comment.trim()}
                  onClick={() =>
                    void addComment
                      .mutateAsync({ assignmentId: id, body: { body: comment } })
                      .then(() => { setComment(''); })
                  }
                >
                  {t('addComment')}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </PermissionGate>
  );
}
