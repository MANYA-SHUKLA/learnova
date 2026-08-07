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
  Textarea,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { use, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatAssignmentType,
  formatDueDate,
  useAddCommentMutation,
  useAssignment,
  useAssignmentComments,
  useSaveDraftMutation,
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
  const [text, setText] = useState('');
  const [comment, setComment] = useState('');

  const assignmentQuery = useAssignment(id);
  const commentsQuery = useAssignmentComments(id);
  const saveDraft = useSaveDraftMutation();
  const submit = useSubmitAssignmentMutation();
  const addComment = useAddCommentMutation();

  const assignment = assignmentQuery.data;
  const comments = commentsQuery.data?.items ?? [];

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
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('due')}: {formatDueDate(assignment.dueDate)} · {assignment.totalMarks}{' '}
                {t('marks')}
              </p>
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
                <CardDescription>{t('submitDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  rows={8}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('textPlaceholder')}
                />
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
                {submit.isSuccess ? (
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
                <Textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('commentPlaceholder')}
                />
                <Button
                  size="sm"
                  disabled={addComment.isPending || !comment.trim()}
                  onClick={() =>
                    void addComment
                      .mutateAsync({ assignmentId: id, body: { body: comment } })
                      .then(() => setComment(''))
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
