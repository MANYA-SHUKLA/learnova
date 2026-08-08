'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@learnova/ui';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { env } from '@/config/env';
import { getAccessToken } from '@/lib/auth/jwt';
import { Link } from '@/lib/i18n/routing';

export default function EnrollmentExportPage() {
  const t = useTranslations('dashboard.institution.enrollments.export');
  const tCommon = useTranslations('common');

  const downloadExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const token = getAccessToken();
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/enrollments/export?format=${format}`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollments-export.${format === 'excel' ? 'xls' : format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PermissionGate permission={PERMISSIONS.ENROLLMENT_READ} enforce>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">{t('formatTitle')}</CardTitle>
            <CardDescription>{t('formatDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" onClick={() => void downloadExport('csv')}>
              <Download className="size-4" />
              Export as CSV
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => void downloadExport('excel')}
            >
              <Download className="size-4" />
              Export as Excel
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => void downloadExport('pdf')}
            >
              <Download className="size-4" />
              Export as PDF
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-start">
          <Button asChild variant="ghost">
            <Link href={APP_ROUTES.INSTITUTION_ENROLLMENTS}>{tCommon('back')}</Link>
          </Button>
        </div>
      </div>
    </PermissionGate>
  );
}
