'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ExamTakingShell } from '@/components/examination/exam-taking-shell';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatExamType,
  formatProctoringMode,
  useCheckInExamMutation,
  useExam,
  useReportViolationMutation,
  useStartExamAttemptMutation,
  useSubmitExamMutation,
  examinationApi,
} from '@/features/examination';
import { useExamSocket } from '@/features/examination/hooks/use-exam-socket';
import { useProctorMedia } from '@/features/examination/hooks/use-proctor-media';
import { useSecureExamMode } from '@/features/examination/hooks/use-secure-exam-mode';
import { useExamStore } from '@/features/examination/store/exam-store';

export default function StudentExamDetailPage() {
  const t = useTranslations('dashboard.student.examDetail');
  const params = useParams<{ id: string }>();
  const examId = params.id;

  const examQuery = useExam(examId);
  const checkInMutation = useCheckInExamMutation();
  const startMutation = useStartExamAttemptMutation();
  const submitMutation = useSubmitExamMutation();
  const reportViolationMutation = useReportViolationMutation();
  const setActiveAttempt = useExamStore((s) => s.setActiveAttempt);
  const clearActiveAttempt = useExamStore((s) => s.clearActiveAttempt);
  const remainingSeconds = useExamStore((s) => s.remainingSeconds);
  const warnings = useExamStore((s) => s.warnings);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<
    Array<{ id: string; question: string; options?: Array<{ id: string; optionText: string }> }>
  >([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [checkedIn, setCheckedIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const exam = examQuery.data;

  const handleViolation = (violationType: string) => {
    if (!attemptId) return;
    void reportViolationMutation.mutateAsync({ attemptId, violationType });
  };

  useSecureExamMode(
    Boolean(attemptId && exam && exam.proctoring.secureBrowser !== 'off'),
    {
      blockCopyPaste: exam?.proctoring.blockCopyPaste,
      blockRightClick: exam?.proctoring.blockRightClick,
      requireFullscreen: exam?.proctoring.requireFullscreen,
    },
    handleViolation,
  );

  useProctorMedia({
    enabled: Boolean(attemptId && exam),
    requireWebcam: exam?.proctoring.requireWebcam,
    requireMicrophone: exam?.proctoring.requireMicrophone,
    onViolation: handleViolation,
  });

  useExamSocket({
    examId,
    attemptId,
    enabled: Boolean(attemptId),
  });

  useEffect(() => {
    if (!attemptId || submitted) return;
    const token = sessionStorage.getItem(`exam-session-${examId}`);
    if (!token) return;

    const interval = window.setInterval(() => {
      void examinationApi.heartbeatAttempt({ sessionToken: token, connected: navigator.onLine });
    }, 15_000);

    const onOffline = () => {
      void examinationApi.heartbeatAttempt({ sessionToken: token, connected: false });
    };
    const onOnline = () => {
      void examinationApi
        .resumeAttempt({ sessionToken: token })
        .then((data) => {
          setQuestions((data.questions as typeof questions) ?? []);
        })
        .catch(() => undefined);
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [attemptId, examId, submitted]);

  const handleCheckIn = async () => {
    await checkInMutation.mutateAsync({ examId });
    setCheckedIn(true);
  };

  const handleStart = async () => {
    const data = await startMutation.mutateAsync({
      examId,
      secureBrowserAcknowledged: true,
    });
    setAttemptId(data.attempt.id);
    setQuestions((data.questions as typeof questions) ?? []);
    setActiveAttempt(examId, data.attempt.id);
    if ('sessionToken' in data && typeof data.sessionToken === 'string') {
      sessionStorage.setItem(`exam-session-${examId}`, data.sessionToken);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) return;
    await submitMutation.mutateAsync({
      attemptId,
      answers: Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
        questionId,
        selectedOptionIds,
        textAnswer: null,
        matchAnswers: {},
        timeSpentSeconds: 0,
      })),
    });
    setSubmitted(true);
    clearActiveAttempt();
  };

  if (examQuery.isError) {
    return (
      <PermissionGate permission={PERMISSIONS.EXAMINATION_WRITE} enforce>
        <ErrorState message={t('error')} onRetry={() => examQuery.refetch()} />
      </PermissionGate>
    );
  }

  return (
    <PermissionGate permission={PERMISSIONS.EXAMINATION_WRITE} enforce>
      <div className="mx-auto max-w-3xl space-y-8">
        {examQuery.isLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : exam ? (
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{exam.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatExamType(exam.examType)} · {formatProctoringMode(exam.proctoring.mode)} ·{' '}
              {exam.rules.durationMinutes} {t('minutes')}
            </p>
            {exam.instructions ? (
              <Card className="mt-4 rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('instructions')}</CardTitle>
                  <CardDescription className="whitespace-pre-wrap">{exam.instructions}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}
            {exam.proctoring.secureBrowser !== 'off' ? (
              <Card className="mt-4 rounded-2xl border-amber-500/30 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="text-base">{t('secureBrowser')}</CardTitle>
                  <CardDescription>{t('secureBrowserDescription')}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}
          </div>
        ) : null}

        {submitted ? (
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('submittedTitle')}</CardTitle>
              <CardDescription>{t('submittedDescription')}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!checkedIn && !attemptId && !submitted ? (
          <Button disabled={checkInMutation.isPending} onClick={() => void handleCheckIn()}>
            {t('checkIn')}
          </Button>
        ) : null}

        {checkedIn && !attemptId && !submitted ? (
          <Button disabled={startMutation.isPending} onClick={() => void handleStart()}>
            {t('startExam')}
          </Button>
        ) : null}

        {attemptId && !submitted && exam ? (
          <ExamTakingShell
            title={exam.title}
            subtitle={`${formatExamType(exam.examType)} · ${exam.rules.durationMinutes} ${t('minutes')}`}
            remainingSeconds={remainingSeconds}
            warnings={warnings}
            questions={questions}
            answers={answers}
            onSelectOption={(questionId, optionId) =>
              setAnswers((prev) => ({ ...prev, [questionId]: [optionId] }))
            }
            onSubmit={() => void handleSubmit()}
            submitting={submitMutation.isPending}
          />
        ) : null}
      </div>
    </PermissionGate>
  );
}
