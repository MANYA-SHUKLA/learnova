'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { Download, Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { env } from '@/config/env';
import { getAccessToken } from '@/lib/auth/jwt';
import { Link } from '@/lib/i18n/routing';

async function download(format: 'csv' | 'excel' | 'pdf') {
  const token = getAccessToken();
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/students/export?format=${format}`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `students-export.${format === 'excel' ? 'xls' : format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StudentExportPage() {
  const t = useTranslations('dashboard.institution.students.export');
  const tCrud = useTranslations('dashboard.institution.crud');
  const tCommon = useTranslations('common');
  return (
    <PermissionGate permission={PERMISSIONS.STUDENT_READ} enforce>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">{t('formatsTitle')}</CardTitle>
            <CardDescription>{t('formatsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void download('csv')}>
              <Download className="size-4" />
              CSV
            </Button>
            <Button type="button" variant="outline" onClick={() => void download('excel')}>
              <Download className="size-4" />
              Excel
            </Button>
            <Button type="button" variant="outline" onClick={() => void download('pdf')}>
              <Download className="size-4" />
              PDF
            </Button>
            <Button type="button" variant="secondary" onClick={() => { window.print(); }}>
              <Printer className="size-4" />
              {tCrud('printPdf')}
            </Button>
            <Button asChild variant="ghost">
              <Link href={APP_ROUTES.INSTITUTION_STUDENTS}>{tCommon('back')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
