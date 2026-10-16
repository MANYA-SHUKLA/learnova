'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CourseSelect, SemesterSelect } from '@/components/shared/entity-selects';
import { PermissionGate } from '@/components/shared/protected-route';
import { getApiErrorMessage } from '@/lib/api/client';
import { useCreateAssignmentMutation, usePublishAssignmentMutation } from '../hooks/use-assignment-queries';

export function GiveAssignmentForm() {
  const t = useTranslations('dashboard.faculty.assignments');
  const createMutation = useCreateAssignmentMutation();
  const publishMutation = usePublishAssignmentMutation();

  const [semesterId, setSemesterId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const pending = createMutation.isPending || publishMutation.isPending;
  const semesterChosen = Boolean(semesterId);

  const reset = () => {
    setCourseId('');
    setTitle('');
    setDueDate('');
    setInstructions('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!semesterId || !courseId || !title.trim()) return;

    try {
      const created = await createMutation.mutateAsync({
        courseId,
        title: title.trim(),
        instructions: instructions.trim() || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assignmentType: 'homework',
      });
      await publishMutation.mutateAsync(created.id);
      reset();
      setSuccess(t('given'));
    } catch (err) {
      setError(getApiErrorMessage(err, t('giveError')));
    }
  };

  return (
    <PermissionGate permission={PERMISSIONS.ASSIGNMENT_WRITE} fallback={null}>
      <Card className="rounded-xl border-border/80 shadow-soft-md">
        <CardHeader>
          <CardTitle className="text-card-title">{t('giveTitle')}</CardTitle>
          <CardDescription>{t('giveDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
            <SemesterSelect
              label={t('semester')}
              value={semesterId}
              limit={100}
              allowEmpty={false}
              onChange={(value) => {
                setSemesterId(value);
                setCourseId('');
                setSuccess(null);
              }}
            />
            <CourseSelect
              key={semesterId || 'all-courses'}
              label={t('course')}
              value={courseId}
              limit={100}
              disabled={!semesterChosen}
              listParams={semesterChosen ? { semesterId } : undefined}
              placeholder={semesterChosen ? undefined : t('selectSemesterFirst')}
              emptyMessage={semesterChosen ? t('noCoursesForSemester') : undefined}
              hint={t('courseHint')}
              onChange={(value) => {
                setCourseId(value);
                setSuccess(null);
              }}
            />
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="assignment-title" className="text-sm font-medium">
                {t('titleLabel')}
              </label>
              <Input
                id="assignment-title"
                value={title}
                required
                placeholder={t('titlePlaceholder')}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setSuccess(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="assignment-due" className="text-sm font-medium">
                {t('dueDate')}
              </label>
              <Input
                id="assignment-due"
                type="datetime-local"
                value={dueDate}
                onChange={(event) => {
                  setDueDate(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="assignment-instructions" className="text-sm font-medium">
                {t('instructions')}
              </label>
              <textarea
                id="assignment-instructions"
                className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                value={instructions}
                placeholder={t('instructionsPlaceholder')}
                onChange={(event) => {
                  setInstructions(event.target.value);
                }}
              />
            </div>
            {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
            {success ? <p className="text-sm text-primary sm:col-span-2">{success}</p> : null}
            <div>
              <Button type="submit" className="rounded-xl" disabled={pending || !semesterId || !courseId || !title.trim()}>
                {pending ? t('giving') : t('give')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PermissionGate>
  );
}
