'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@learnova/ui';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { CourseSelect, StudentSelect } from '@/components/shared/entity-selects';
import { ErrorState } from '@/features/institution';
import {
  useInstitutionSettings,
  useUpdateInstitutionSettingsMutation,
} from '@/features/institution';
import {
  CertificateListCard,
  CertificateListRow,
  CertificatePageHeader,
  CertificateStatCard,
  CertificateStatGrid,
  openCertificateForPrint,
  useBulkIssueCertificatesMutation,
  useCertificateAuditQuery,
  useCertificateList,
  useCertificateTemplates,
  useCreateCertificateTemplateMutation,
  useInstitutionCertificateDashboard,
  useIssueCertificateMutation,
  useRevokeCertificateMutation,
} from '@/features/certificate';

function readAutoIssue(settings: { certificateSettings?: Record<string, unknown> } | undefined) {
  const raw = settings?.certificateSettings;
  if (!raw || typeof raw !== 'object') {
    return { courseCompletion: false, publishOnIssue: true };
  }
  const cert = raw;
  const autoIssue = cert['autoIssue'];
  if (autoIssue && typeof autoIssue === 'object') {
    const nested = autoIssue as Record<string, unknown>;
    return {
      courseCompletion: nested['courseCompletion'] === true,
      publishOnIssue: nested['publishOnIssue'] !== false,
    };
  }
  return {
    courseCompletion: cert['autoIssueCourseCompletion'] === true,
    publishOnIssue: cert['publishOnAutoIssue'] !== false,
  };
}

export default function InstitutionCertificatesPage() {
  const t = useTranslations('dashboard.institution.certificates');
  const [courseId, setCourseId] = useState('');
  const [manualCourseId, setManualCourseId] = useState('');
  const [manualStudentId, setManualStudentId] = useState('');
  const [templateName, setTemplateName] = useState('Course completion');

  const dashQuery = useInstitutionCertificateDashboard();
  const listQuery = useCertificateList({ page: '1', limit: '25' });
  const templatesQuery = useCertificateTemplates('course_completion');
  const auditQuery = useCertificateAuditQuery();
  const settingsQuery = useInstitutionSettings();
  const saveSettingsMutation = useUpdateInstitutionSettingsMutation();

  const bulkMutation = useBulkIssueCertificatesMutation();
  const issueMutation = useIssueCertificateMutation();
  const revokeMutation = useRevokeCertificateMutation();
  const createTemplateMutation = useCreateCertificateTemplateMutation();

  const dash = dashQuery.data;
  const rows = listQuery.data?.items ?? [];
  const templates = templatesQuery.data ?? [];
  const auditRows = auditQuery.data ?? [];
  const autoIssue = useMemo(
    () => readAutoIssue(settingsQuery.data),
    [settingsQuery.data],
  );

  const handleAutoIssueToggle = (enabled: boolean) => {
    const current = settingsQuery.data?.certificateSettings ?? {};
    void saveSettingsMutation.mutateAsync({
      certificateSettings: {
        ...current,
        autoIssue: {
          courseCompletion: enabled,
          publishOnIssue: autoIssue.publishOnIssue,
        },
      },
    });
  };

  const handleRevoke = (certificateId: string) => {
    const reason = window.prompt(t('revokeReason'));
    if (!reason?.trim()) return;
    void revokeMutation.mutateAsync({ certificateId, reason: reason.trim() });
  };

  return (
    <PermissionGate permission={PERMISSIONS.CERTIFICATE_READ} enforce>
      <div className="space-y-8">
        <CertificatePageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        {dashQuery.isError ? (
          <ErrorState message={t('error')} onRetry={() => dashQuery.refetch()} />
        ) : (
          <CertificateStatGrid loading={dashQuery.isLoading}>
            <CertificateStatCard label={t('stats.issued')} value={dash?.issuedCount ?? 0} />
            <CertificateStatCard label={t('stats.transcripts')} value={dash?.transcriptCount ?? 0} />
            <CertificateStatCard label={t('stats.eligible')} value={dash?.pendingEligible ?? 0} />
            <CertificateStatCard label={t('stats.revoked')} value={dash?.revokedCount ?? 0} />
          </CertificateStatGrid>
        )}

        <Card className="rounded-2xl border-border/80 shadow-soft-sm">
          <CardHeader>
            <CardTitle className="text-base">{t('autoIssueTitle')}</CardTitle>
            <CardDescription>{t('autoIssueDescription')}</CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant={autoIssue.courseCompletion ? 'default' : 'outline'}
                disabled={saveSettingsMutation.isPending}
                onClick={() => {
                  handleAutoIssueToggle(!autoIssue.courseCompletion);
                }}
              >
                {autoIssue.courseCompletion ? t('autoIssueOn') : t('autoIssueOff')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-soft-sm">
          <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">{t('bulkTitle')}</CardTitle>
              <CardDescription>{t('bulkDescription')}</CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <CourseSelect className="sm:w-80" value={courseId} onChange={setCourseId} />
              <Button
                disabled={!courseId || bulkMutation.isPending}
                onClick={() => {
                  void bulkMutation.mutateAsync({ courseId, publish: true });
                }}
              >
                {t('bulkIssue')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-soft-sm">
          <CardHeader>
            <CardTitle className="text-base">{t('manualIssueTitle')}</CardTitle>
            <CardDescription>{t('manualIssueDescription')}</CardDescription>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <CourseSelect value={manualCourseId} onChange={setManualCourseId} label={t('course')} />
              <StudentSelect
                value={manualStudentId}
                onChange={setManualStudentId}
                label={t('student')}
              />
            </div>
            <Button
              className="mt-3"
              size="sm"
              disabled={!manualCourseId || !manualStudentId || issueMutation.isPending}
              onClick={() => {
                void issueMutation.mutateAsync({
                  studentId: manualStudentId,
                  courseId: manualCourseId,
                  documentType: 'course_completion',
                  publish: true,
                });
              }}
            >
              {t('manualIssue')}
            </Button>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-soft-sm">
          <CardHeader>
            <CardTitle className="text-base">{t('templatesTitle')}</CardTitle>
            <CardDescription>{t('templatesDescription')}</CardDescription>
            {templatesQuery.isLoading ? (
              <Skeleton className="mt-3 h-16 rounded-xl" />
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {templates.map((tpl) => (
                  <li key={tpl.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
                    <span>{tpl.name}</span>
                    <span className="text-muted-foreground">{tpl.documentType}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Input
                className="max-w-xs"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                }}
                placeholder={t('templateNamePlaceholder')}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!templateName.trim() || createTemplateMutation.isPending}
                onClick={() => {
                  void createTemplateMutation.mutateAsync({
                    name: templateName.trim(),
                    documentType: 'course_completion',
                    titleTemplate: 'Certificate of Completion',
                    bodyTemplate:
                      'has successfully completed the course with published passing grades.',
                    active: true,
                  });
                }}
              >
                {t('createTemplate')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <CertificateListCard
          title={t('listTitle')}
          description={t('listDescription')}
          icon={<Award className="size-4 text-primary" />}
          isLoading={listQuery.isLoading}
          isError={listQuery.isError}
          errorMessage={t('error')}
          onRetry={() => listQuery.refetch()}
          emptyTitle={rows.length === 0 && !listQuery.isLoading ? t('emptyTitle') : undefined}
          emptyDescription={t('emptyDescription')}
        >
          {rows.map((row) => (
            <CertificateListRow
              key={row.id}
              primary={row.title ?? 'Certificate'}
              secondary={`${row.documentType ?? 'document'} · ${row.certificateNumber ?? row.verificationCode ?? row.id}`}
              status={row.status ?? 'draft'}
              actions={
                <>
                  {row.status !== 'revoked' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void openCertificateForPrint(row.id);
                      }}
                    >
                      {t('download')}
                    </Button>
                  ) : null}
                  {row.verificationCode ? (
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/verify/${row.verificationCode}`} target="_blank">
                        {t('verify')}
                      </Link>
                    </Button>
                  ) : null}
                  {row.status !== 'revoked' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={revokeMutation.isPending}
                      onClick={() => {
                        handleRevoke(row.id);
                      }}
                    >
                      {t('revoke')}
                    </Button>
                  ) : null}
                </>
              }
            />
          ))}
        </CertificateListCard>

        <Card className="rounded-2xl border-border/80 shadow-soft-sm">
          <CardHeader>
            <CardTitle className="text-base">{t('auditTitle')}</CardTitle>
            <CardDescription>{t('auditDescription')}</CardDescription>
            {auditQuery.isLoading ? (
              <Skeleton className="mt-3 h-24 rounded-xl" />
            ) : auditRows.length === 0 ? (
              <CardDescription className="pt-2">{t('auditEmpty')}</CardDescription>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {auditRows.map((row) => (
                  <li key={row.id} className="rounded-xl border px-3 py-2">
                    <span className="font-medium">{row.event ?? 'event'}</span>
                    <span className="ml-2 text-muted-foreground">{row.createdAt ?? ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardHeader>
        </Card>
      </div>
    </PermissionGate>
  );
}
