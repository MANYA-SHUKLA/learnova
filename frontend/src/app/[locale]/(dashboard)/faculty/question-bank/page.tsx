'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState } from '@/features/institution';
import { useQuestionBanks, useQuestionList } from '@/features/quiz';

export default function FacultyQuestionBankPage() {
  const t = useTranslations('dashboard.faculty.questionBank');
  const banksQuery = useQuestionBanks();
  const questionsQuery = useQuestionList({ page: 1, limit: 15 });
  const banks = banksQuery.data?.items ?? [];
  const questions = questionsQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.QUIZ_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardDescription>{t('banks')}</CardDescription>
              <CardTitle className="text-2xl">
                {banksQuery.isLoading ? <Skeleton className="h-8 w-10" /> : banks.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardDescription>{t('questions')}</CardDescription>
              <CardTitle className="text-2xl">
                {questionsQuery.isLoading ? (
                  <Skeleton className="h-8 w-10" />
                ) : (
                  (questionsQuery.data?.meta.total ?? questions.length)
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {questions.length === 0 && !questionsQuery.isLoading ? (
          <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <Card key={q.id} className="rounded-2xl border-border/80 p-4">
                <p className="line-clamp-2 font-medium">{q.question}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {q.questionType} · {q.difficulty} · {q.marks} {t('marks')}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
