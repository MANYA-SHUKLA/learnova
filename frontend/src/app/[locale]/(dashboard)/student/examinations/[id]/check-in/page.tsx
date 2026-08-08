'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import { Button, Skeleton } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ExamSystemCheck } from '@/components/examination/exam-system-check';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import { formatExamType, useExam } from '@/features/examination';
import { Link } from '@/lib/i18n/routing';

export default function StudentExamCheckInPage() {
  const t = useTranslations('dashboard.student.examSystemCheck');
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const examId = params.id;
  const examQuery = useExam(examId);
  const [ready, setReady] = useState(false);

  const exam = examQuery.data;

  if (examQuery.isError) {
    return (
      <ErrorState
        title={t('error')}
        onRetry={() => {
          void examQuery.refetch();
        }}
      />
    );
  }

  return (
    <PermissionGate permission={PERMISSIONS.EXAMINATION_READ} enforce>
      <div className="mx-auto max-w-2xl space-y-6">
        {examQuery.isLoading || !exam ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{exam.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{formatExamType(exam.examType)}</p>
            </div>

            <ExamSystemCheck
              requireWebcam={exam.proctoring.requireWebcam}
              requireMicrophone={exam.proctoring.requireMicrophone}
              requireFullscreen={exam.proctoring.requireFullscreen}
              onReadyChange={(isReady) => {
                setReady(isReady);
              }}
            />

            <div className="flex gap-3">
              <Button
                disabled={!ready}
                onClick={() => {
                  router.push(APP_ROUTES.STUDENT_EXAM_DETAIL.replace(':id', examId));
                }}
              >
                {t('continue')}
              </Button>
              <Button variant="outline" asChild>
                <Link href={APP_ROUTES.STUDENT_EXAMINATIONS}>{t('back')}</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </PermissionGate>
  );
}
