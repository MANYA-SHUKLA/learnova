'use client';

import { Button } from '@learnova/ui';
import { useTranslations } from 'next-intl';

import { reportsApi } from '../services/reports-api';

export function ReportExportMenu({
  scope,
  courseId,
}: {
  scope: 'institution' | 'faculty' | 'student';
  courseId?: string;
}) {
  const t = useTranslations('dashboard.reports.export');

  const download = (format: 'csv' | 'excel' | 'pdf') => {
    const url = reportsApi.exportUrl({ scope, format, courseId });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => { download('csv'); }}>
        {t('csv')}
      </Button>
      <Button size="sm" variant="outline" onClick={() => { download('excel'); }}>
        {t('excel')}
      </Button>
      <Button size="sm" variant="outline" onClick={() => { download('pdf'); }}>
        {t('pdf')}
      </Button>
    </div>
  );
}
