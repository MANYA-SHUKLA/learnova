'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { studentApi, useStudentImportMutation } from '@/features/student';
import { ApiClientError } from '@/lib/api/client';
import { Link, useRouter } from '@/lib/i18n/routing';
import type { StudentImportPreview } from '@learnova/types';

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

export default function StudentImportPage() {
  const t = useTranslations('dashboard.institution.students.import');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const importMutation = useStudentImportMutation();
  const [preview, setPreview] = useState<StudentImportPreview | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    const text = await file.text();
    const parsed = parseCsv(text);
    setRows(parsed);
    try {
      const result = await studentApi.previewImport(parsed);
      setPreview(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('previewFailed'));
    }
  };

  const onImport = async () => {
    setError(null);
    try {
      await importMutation.mutateAsync(rows);
      router.push(APP_ROUTES.INSTITUTION_STUDENTS);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('importFailed'));
    }
  };

  return (
    <PermissionGate permission={PERMISSIONS.STUDENT_MANAGE} enforce>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">{t('uploadTitle')}</CardTitle>
            <CardDescription>
              {t('uploadDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            {preview ? (
              <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4 text-sm">
                <p>{t('totalRows', { count: preview.totalRows })}</p>
                <p>{t('valid', { count: preview.validRows })}</p>
                <p>{t('invalid', { count: preview.invalidRows })}</p>
                <p>{t('duplicates', { count: preview.duplicates })}</p>
                {preview.errors.slice(0, 8).map((err) => (
                  <p key={`${err.row}-${err.message}`} className="text-danger">
                    {t('rowError', {
                      row: err.row,
                      field: err.field ? ` · ${err.field}` : '',
                      message: err.message,
                    })}
                  </p>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={!preview || preview.invalidRows > 0 || importMutation.isPending || rows.length === 0}
                onClick={() => void onImport()}
              >
                {importMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    {t('importing')}
                  </>
                ) : (
                  t('confirmImport')
                )}
              </Button>
              <Button asChild variant="outline">
                <Link href={APP_ROUTES.INSTITUTION_STUDENTS}>{tCommon('cancel')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
