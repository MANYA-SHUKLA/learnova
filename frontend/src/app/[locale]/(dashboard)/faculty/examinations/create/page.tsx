'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardDescription, CardHeader, CardTitle, Input } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { CourseSelect } from '@/components/shared/entity-selects';
import { useCreateExamMutation } from '@/features/examination';
import { Link } from '@/lib/i18n/routing';

export default function FacultyCreateExamPage() {
  const t = useTranslations('dashboard.faculty.examCreate');
  const router = useRouter();
  const createMutation = useCreateExamMutation();

  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('120');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const exam = await createMutation.mutateAsync({
      courseId,
      title,
      examType: 'internal',
      visibility: 'enrolled',
      seatingEnabled: false,
      sections: [],
      schedule: {
        startsAt: start,
        endsAt: end,
        lateEntryMinutes: 15,
        gracePeriodMinutes: 5,
      },
      proctoring: {
        mode: 'live',
        secureBrowser: 'required',
        requireWebcam: true,
        requireMicrophone: false,
        blockCopyPaste: true,
        blockRightClick: true,
        blockNewTabs: true,
        requireFullscreen: true,
        maxTabSwitches: 3,
        autoTerminateOnViolation: false,
        invigilatorIds: [],
      },
      rules: {
        durationMinutes: Number(durationMinutes) || 120,
        passingMarks: 40,
        totalMarks: 100,
        attemptLimit: 1,
        negativeMarking: false,
        negativeMarkValue: 0.25,
        shuffleQuestions: true,
        shuffleOptions: true,
        showResultsAfter: 'schedule_end',
        allowReview: false,
        showCorrectAnswers: false,
      },
      questionIds: [],
    });
    router.push(APP_ROUTES.FACULTY_EXAM_DETAIL.replace(':id', exam.id));
  };

  return (
    <PermissionGate permission={PERMISSIONS.EXAMINATION_WRITE} enforce>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">{t('formTitle')}</CardTitle>
            <CardDescription>{t('formDescription')}</CardDescription>
          </CardHeader>
          <form
            className="space-y-4 p-4 pt-0"
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
          >
            <div className="space-y-2">
              <label htmlFor="course" className="text-sm font-medium">
                {t('course')}
              </label>
              <CourseSelect value={courseId} onChange={setCourseId} label={t('course')} />
            </div>
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                {t('examTitle')}
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="startsAt" className="text-sm font-medium">
                  {t('startsAt')}
                </label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => {
                    setStartsAt(e.target.value);
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="endsAt" className="text-sm font-medium">
                  {t('endsAt')}
                </label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => {
                    setEndsAt(e.target.value);
                  }}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-medium">
                {t('duration')}
              </label>
              <Input
                id="duration"
                type="number"
                min={15}
                max={600}
                value={durationMinutes}
                onChange={(e) => {
                  setDurationMinutes(e.target.value);
                }}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createMutation.isPending || !courseId || !title}>
                {createMutation.isPending ? t('creating') : t('create')}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={APP_ROUTES.FACULTY_EXAMINATIONS}>{t('cancel')}</Link>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PermissionGate>
  );
}
