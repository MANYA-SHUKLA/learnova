'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  formatExamStatus,
  useExamList,
  useLiveMonitoringQuery,
} from '@/features/examination';
import { useExamSocket } from '@/features/examination/hooks/use-exam-socket';
import { useExamStore } from '@/features/examination/store/exam-store';

export default function FacultyExamsLivePage() {
  const t = useTranslations('dashboard.faculty.proctoring');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const listQuery = useExamList({ status: 'in_progress', page: 1, limit: 20 });
  const exams = listQuery.data?.items ?? [];
  const activeExamId = selectedExamId ?? exams[0]?.id ?? null;

  const liveQuery = useLiveMonitoringQuery(activeExamId);
  const liveStats = useExamStore((s) => s.liveStats);

  useExamSocket({ examId: activeExamId, enabled: Boolean(activeExamId) });

  const stats = useMemo(
    () => liveQuery.data?.stats ?? liveStats ?? { online: 0, started: 0, submitted: 0, disconnected: 0, warnings: 0, violations: 0 },
    [liveQuery.data?.stats, liveStats],
  );

  return (
    <PermissionGate permission={PERMISSIONS.EXAMINATION_PROCTOR} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {exams.map((exam) => (
            <Button
              key={exam.id}
              size="sm"
              variant={activeExamId === exam.id ? 'default' : 'outline'}
              onClick={() => setSelectedExamId(exam.id)}
            >
              {exam.title}
            </Button>
          ))}
        </div>

        {liveQuery.isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Online', value: stats.online },
                { label: 'Started', value: stats.started },
                { label: 'Submitted', value: stats.submitted },
                { label: 'Disconnected', value: stats.disconnected },
                { label: 'Warnings', value: stats.warnings },
                { label: 'Violations', value: stats.violations },
              ].map((item) => (
                <Card key={item.label} className="rounded-2xl border-border/80">
                  <CardHeader>
                    <CardDescription>{item.label}</CardDescription>
                    <CardTitle className="text-2xl">{item.value}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <Card className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base">{t('activeTitle')}</CardTitle>
                <CardDescription>{t('activeDescription')}</CardDescription>
              </CardHeader>
              <div className="divide-y divide-border/60 p-4 pt-0">
                {(liveQuery.data?.attempts ?? []).slice(0, 20).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <span>{attempt.id.slice(-8)}</span>
                    <Badge variant="outline">{formatExamStatus(attempt.status)}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base">Recent violations</CardTitle>
              </CardHeader>
              <div className="space-y-2 p-4 pt-0 text-sm">
                {(liveQuery.data?.recentViolations ?? []).slice(0, 10).map((v) => (
                  <div key={v.id} className="flex justify-between rounded-lg border border-border/60 px-3 py-2">
                    <span>{v.violationType}</span>
                    <Badge variant="secondary">{v.severity}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </PermissionGate>
  );
}
