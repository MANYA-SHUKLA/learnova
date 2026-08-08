'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatExamStatus,
  formatExamType,
  formatExamWindow,
  useExam,
  usePublishExamMutation,
} from '@/features/examination';
import { examinationApi } from '@/features/examination/services/examination-api';
import { Link } from '@/lib/i18n/routing';

export default function FacultyExamDetailPage() {
  const t = useTranslations('dashboard.faculty.examDetail');
  const params = useParams<{ id: string }>();
  const examId = params.id;
  const examQuery = useExam(examId);
  const publishMutation = usePublishExamMutation();
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const exam = examQuery.data;

  const handleBroadcast = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) return;
    setBroadcasting(true);
    try {
      await examinationApi.broadcastAnnouncement({
        examId,
        title: announcementTitle,
        message: announcementMessage,
        announcementType: 'instructions',
      });
      setAnnouncementTitle('');
      setAnnouncementMessage('');
    } finally {
      setBroadcasting(false);
    }
  };

  if (examQuery.isError) {
    return (
      <ErrorState
        message={t('error')}
        onRetry={() => {
          void examQuery.refetch();
        }}
      />
    );
  }

  return (
    <PermissionGate permission={PERMISSIONS.EXAMINATION_READ} enforce>
      <div className="space-y-6">
        {examQuery.isLoading || !exam ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
                <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{exam.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatExamType(exam.examType)} ·{' '}
                  {formatExamWindow(exam.schedule.startsAt, exam.schedule.endsAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{formatExamStatus(exam.status)}</Badge>
                  <Badge variant="secondary">{exam.proctoring.secureBrowser}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {exam.status === 'draft' ? (
                  <Button
                    size="sm"
                    disabled={publishMutation.isPending}
                    onClick={() => void publishMutation.mutateAsync(examId)}
                  >
                    {t('publish')}
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" asChild>
                  <Link href={`${APP_ROUTES.FACULTY_EXAMS_LIVE}?examId=${examId}`}>
                    {t('liveMonitor')}
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base">{t('announcementTitle')}</CardTitle>
                <CardDescription>{t('announcementDescription')}</CardDescription>
              </CardHeader>
              <div className="space-y-3 p-4 pt-0">
                <div className="space-y-2">
                  <label htmlFor="ann-title" className="text-sm font-medium">
                    {t('announcementFieldTitle')}
                  </label>
                  <Input
                    id="ann-title"
                    value={announcementTitle}
                    onChange={(e) => {
                      setAnnouncementTitle(e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ann-message" className="text-sm font-medium">
                    {t('announcementFieldMessage')}
                  </label>
                  <textarea
                    id="ann-message"
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={announcementMessage}
                    onChange={(e) => {
                      setAnnouncementMessage(e.target.value);
                    }}
                  />
                </div>
                <Button
                  size="sm"
                  disabled={broadcasting}
                  onClick={() => {
                    void handleBroadcast();
                  }}
                >
                  {broadcasting ? t('broadcasting') : t('broadcast')}
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </PermissionGate>
  );
}
