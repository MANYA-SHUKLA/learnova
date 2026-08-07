'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@learnova/ui';
import { Library } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import { useQuestionBanks, useQuestionList } from '@/features/quiz';

export default function InstitutionQuestionBankPage() {
  const t = useTranslations('dashboard.institution.questionBank');
  const banksQuery = useQuestionBanks();
  const questionsQuery = useQuestionList({ page: 1, limit: 10 });
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('banksTitle')}</CardTitle>
              <CardDescription>{t('banksDescription')}</CardDescription>
            </CardHeader>
            {banksQuery.isError ? (
              <div className="p-6">
                <ErrorState message={t('error')} onRetry={() => banksQuery.refetch()} />
              </div>
            ) : banksQuery.isLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : banks.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={Library} title={t('emptyBanks')} description={t('emptyBanksDescription')} />
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {banks.map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{bank.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {bank.questionCount} {t('questions')}
                      </p>
                    </div>
                    <Badge variant="outline">{bank.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('recentQuestions')}</CardTitle>
              <CardDescription>{t('recentQuestionsDescription')}</CardDescription>
            </CardHeader>
            {questionsQuery.isLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : questions.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={Library} title={t('emptyQuestions')} description={t('emptyQuestionsDescription')} />
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {questions.map((q) => (
                  <div key={q.id} className="p-4">
                    <p className="line-clamp-2 font-medium">{q.question}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {q.questionType} · {q.marks} {t('marks')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PermissionGate>
  );
}
