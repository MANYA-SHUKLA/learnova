'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardDescription, CardHeader, CardTitle, Input, Skeleton } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  useAcademicPolicyQuery,
  useUpsertAcademicPolicyMutation,
} from '@/features/gradebook';

export default function InstitutionGradebookPoliciesPage() {
  const t = useTranslations('dashboard.institution.gradebookPolicies');
  const policyQuery = useAcademicPolicyQuery();
  const saveMutation = useUpsertAcademicPolicyMutation();
  const policy = policyQuery.data;

  const [passingPercentage, setPassingPercentage] = useState('60');
  const [minimumGpa, setMinimumGpa] = useState('2.0');

  const handleSave = () => {
    void saveMutation.mutateAsync({
      creditBasedGrading: policy?.creditBasedGrading ?? true,
      passingCriteria: policy?.passingCriteria ?? 'both',
      passingPercentage: Number(passingPercentage) || 60,
      passingGradeLetters: policy?.passingGradeLetters ?? [
        'A+',
        'A',
        'A-',
        'B+',
        'B',
        'B-',
        'C+',
        'C',
        'C-',
        'D+',
        'D',
        'D-',
      ],
      gradingScheme: policy?.gradingScheme ?? 'absolute',
      gpaFormula: policy?.gpaFormula ?? 'credit_weighted',
      cgpaFormula: policy?.cgpaFormula ?? 'credit_weighted',
      gradeReplacementPolicy: policy?.gradeReplacementPolicy ?? 'replace_if_higher',
      makeupAttemptPolicy: policy?.makeupAttemptPolicy ?? 'best',
      improvementAttemptPolicy: policy?.improvementAttemptPolicy ?? 'best',
      improvementExamTypes: policy?.improvementExamTypes ?? [],
      standingThresholds: {
        warningGpa: Number(minimumGpa) || 2,
        probationGpa: policy?.standingThresholds?.probationGpa ?? 1.5,
        honorsGpa: policy?.standingThresholds?.honorsGpa ?? 3.5,
        distinctionGpa: policy?.standingThresholds?.distinctionGpa ?? 3.8,
        failedCourseLimit: policy?.standingThresholds?.failedCourseLimit ?? 2,
      },
    });
  };

  return (
    <PermissionGate permission={PERMISSIONS.GRADEBOOK_MANAGE} enforce>
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
          <div className="space-y-4 p-4 pt-0">
            {policyQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="passing" className="text-sm font-medium">
                    {t('passingPercentage')}
                  </label>
                  <Input
                    id="passing"
                    type="number"
                    min={0}
                    max={100}
                    value={passingPercentage}
                    onChange={(e) => {
                      setPassingPercentage(e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="minGpa" className="text-sm font-medium">
                    {t('minimumGpa')}
                  </label>
                  <Input
                    id="minGpa"
                    type="number"
                    min={0}
                    max={4}
                    step={0.1}
                    value={minimumGpa}
                    onChange={(e) => {
                      setMinimumGpa(e.target.value);
                    }}
                  />
                </div>
                <Button disabled={saveMutation.isPending} onClick={handleSave}>
                  {saveMutation.isPending ? t('saving') : t('save')}
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </PermissionGate>
  );
}
