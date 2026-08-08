'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatDuration,
  formatQuizType,
  useQuiz,
  useStartAttemptMutation,
  useSubmitQuizMutation,
} from '@/features/quiz';
import { Link } from '@/lib/i18n/routing';

export default function StudentQuizAttemptPage() {
  const t = useTranslations('dashboard.student.quizAttempt');
  const params = useParams<{ id: string }>();
  const quizId = params.id;

  const quizQuery = useQuiz(quizId);
  const startMutation = useStartAttemptMutation();
  const submitMutation = useSubmitQuizMutation();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<{ id: string; question: string; options?: { id: string; optionText: string }[] }[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<{ score: number; percentage: number; passed: boolean } | null>(null);

  const quiz = quizQuery.data;
  const canStart = useMemo(
    () => quiz?.status === 'published' && !attemptId && !result,
    [quiz?.status, attemptId, result],
  );

  const handleStart = async () => {
    const data = await startMutation.mutateAsync({ quizId });
    setAttemptId(data.attempt.id);
    setQuestions((data.questions as typeof questions) ?? []);
  };

  const handleSubmit = async () => {
    if (!attemptId) return;
    const payload = {
      attemptId,
      answers: Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
        questionId,
        selectedOptionIds,
        textAnswer: null,
        matchAnswers: {},
        timeSpentSeconds: 0,
      })),
    };
    const data = await submitMutation.mutateAsync(payload);
    setResult({
      score: data.result.score,
      percentage: data.result.percentage,
      passed: data.result.passed,
    });
  };

  const toggleOption = (questionId: string, optionId: string, multiple: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (multiple) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: next };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  };

  if (quizQuery.isError) {
    return (
      <PermissionGate permission={PERMISSIONS.QUIZ_WRITE} enforce>
        <ErrorState message={t('error')} onRetry={() => quizQuery.refetch()} />
      </PermissionGate>
    );
  }

  return (
    <PermissionGate permission={PERMISSIONS.QUIZ_WRITE} enforce>
      <div className="mx-auto max-w-3xl space-y-8">
        {quizQuery.isLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : quiz ? (
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{quiz.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatQuizType(quiz.quizType)} · {formatDuration(quiz.durationMinutes)} ·{' '}
              {quiz.passingMarks}/{quiz.totalMarks} {t('passMarks')}
            </p>
            {quiz.instructions ? (
              <Card className="mt-4 rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('instructions')}</CardTitle>
                  <CardDescription className="whitespace-pre-wrap">{quiz.instructions}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}
          </div>
        ) : null}

        {result ? (
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('resultTitle')}</CardTitle>
              <CardDescription>
                {t('score')}: {result.score.toFixed(1)} ({result.percentage.toFixed(1)}%)
              </CardDescription>
              <Badge className="w-fit" variant={result.passed ? 'default' : 'danger'}>
                {result.passed ? t('passed') : t('failed')}
              </Badge>
              <Button asChild className="mt-4 w-fit" variant="outline">
                <Link href="/student/results">{t('viewResults')}</Link>
              </Button>
            </CardHeader>
          </Card>
        ) : null}

        {canStart ? (
          <Button disabled={startMutation.isPending} onClick={() => void handleStart()}>
            {t('startQuiz')}
          </Button>
        ) : null}

        {attemptId && !result ? (
          <div className="space-y-6">
            {questions.map((q, index) => (
              <Card key={q.id} className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">
                    {index + 1}. {q.question}
                  </CardTitle>
                  <div className="mt-4 space-y-2">
                    {(q.options ?? []).map((opt) => {
                      const selected = (answers[q.id] ?? []).includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                            selected
                              ? 'border-primary bg-primary/5'
                              : 'border-border/80 hover:border-primary/40'
                          }`}
                          onClick={() => { toggleOption(q.id, opt.id, false); }}
                        >
                          {opt.optionText}
                        </button>
                      );
                    })}
                  </div>
                </CardHeader>
              </Card>
            ))}
            <Button disabled={submitMutation.isPending} onClick={() => void handleSubmit()}>
              {t('submitQuiz')}
            </Button>
          </div>
        ) : null}
      </div>
    </PermissionGate>
  );
}
