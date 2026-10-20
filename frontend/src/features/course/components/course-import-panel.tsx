'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Spinner,
} from '@learnova/ui';
import type { CourseImportPreview } from '@learnova/types';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  AcademicYearSelect,
  DepartmentSelect,
  ProgramSelect,
  SemesterSelect,
} from '@/components/shared/entity-selects';
import { ApiClientError } from '@/lib/api/client';
import { useCourseImportMutation } from '../hooks/use-course-queries';
import { courseApi } from '../services/course-api';
import {
  downloadCsvTemplate,
  extractTextFromPdf,
  parseCourseCsv,
  parseCourseTextLines,
} from '../lib/course-import-utils';
import { useRouter } from '@/lib/i18n/routing';
import { APP_ROUTES } from '@learnova/constants';

type ImportMode = 'file' | 'program';

export interface CourseImportDefaults {
  programIds?: string[];
  semesterIds?: string[];
  departmentId?: string;
}

interface ManualRow {
  courseCode: string;
  title: string;
  credits: string;
}

const emptyManualRow = (): ManualRow => ({ courseCode: '', title: '', credits: '3' });

export function CourseImportPanel() {
  const t = useTranslations('dashboard.institution.courses.import');
  const router = useRouter();
  const importMutation = useCourseImportMutation();

  const [mode, setMode] = useState<ImportMode>('file');
  const [preview, setPreview] = useState<CourseImportPreview | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [defaults, setDefaults] = useState<CourseImportDefaults>({});
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [academicYearId, setAcademicYearId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [programId, setProgramId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [manualRows, setManualRows] = useState<ManualRow[]>([
    emptyManualRow(),
    emptyManualRow(),
    emptyManualRow(),
  ]);

  const runPreview = async (
    nextRows: Record<string, string>[],
    nextDefaults?: CourseImportDefaults,
  ) => {
    setRows(nextRows);
    if (nextDefaults) setDefaults(nextDefaults);
    setError(null);
    if (nextRows.length === 0) {
      setPreview(null);
      return;
    }
    try {
      const result = await courseApi.previewImport(nextRows);
      setPreview(result);
    } catch (err) {
      setPreview(null);
      setError(err instanceof ApiClientError ? err.message : t('previewFailed'));
    }
  };

  const onCsvFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    await runPreview(parseCourseCsv(text), defaults);
  };

  const onPdfFile = async (file: File | null) => {
    if (!file) return;
    setPdfLoading(true);
    setError(null);
    try {
      const text = await extractTextFromPdf(file);
      const parsed = parseCourseTextLines(text);
      if (parsed.length === 0) {
        setError(t('pdfNoRows'));
        setPreview(null);
        setRows([]);
        return;
      }
      await runPreview(parsed, defaults);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pdfFailed'));
    } finally {
      setPdfLoading(false);
    }
  };

  const buildManualImport = async () => {
    const nextDefaults: CourseImportDefaults = {
      programIds: programId ? [programId] : undefined,
      semesterIds: semesterId ? [semesterId] : undefined,
      departmentId: departmentId || undefined,
    };
    const nextRows = manualRows
      .filter((row) => row.courseCode.trim() && row.title.trim())
      .map((row) => ({
        courseCode: row.courseCode.trim(),
        title: row.title.trim(),
        credits: row.credits.trim() || '3',
        status: 'published',
        visibility: 'institution',
        category: 'general',
        difficulty: 'intermediate',
        language: 'en',
      }));
    if (!semesterId || !programId) {
      setError(t('programContextRequired'));
      return;
    }
    if (nextRows.length === 0) {
      setError(t('programRowsRequired'));
      return;
    }
    await runPreview(nextRows, nextDefaults);
  };

  const onImport = async () => {
    setError(null);
    try {
      await importMutation.mutateAsync({ rows, defaults });
      router.push(APP_ROUTES.INSTITUTION_COURSES);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('importFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === 'file' ? 'default' : 'outline'}
          onClick={() => { setMode('file'); }}
        >
          {t('modeFile')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'program' ? 'default' : 'outline'}
          onClick={() => { setMode('program'); }}
        >
          {t('modeProgram')}
        </Button>
      </div>

      {mode === 'file' ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">{t('uploadTitle')}</CardTitle>
            <CardDescription>{t('uploadDescriptionExtended')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={downloadCsvTemplate}>
                {t('downloadTemplate')}
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="course-csv">{t('csvFile')}</Label>
                <Input
                  id="course-csv"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => void onCsvFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-pdf">{t('pdfFile')}</Label>
                <Input
                  id="course-pdf"
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={pdfLoading}
                  onChange={(e) => void onPdfFile(e.target.files?.[0] ?? null)}
                />
                {pdfLoading ? (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Spinner size="sm" />
                    {t('pdfParsing')}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t('pdfHint')}</p>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ProgramSelect
                btechOnly
                label={t('defaultProgram')}
                value={defaults.programIds?.[0] ?? ''}
                onChange={(value) => {
                  setDefaults((prev) => ({
                    ...prev,
                    programIds: value ? [value] : undefined,
                  }));
                }}
              />
              <SemesterSelect
                label={t('defaultSemester')}
                value={defaults.semesterIds?.[0] ?? ''}
                listParams={academicYearId ? { academicYearId } : undefined}
                onChange={(value) => {
                  setDefaults((prev) => ({
                    ...prev,
                    semesterIds: value ? [value] : undefined,
                  }));
                }}
              />
              <AcademicYearSelect
                label={t('academicYear')}
                value={academicYearId}
                onChange={setAcademicYearId}
              />
              <DepartmentSelect
                label={t('defaultDepartment')}
                value={defaults.departmentId ?? ''}
                onChange={(value) => {
                  setDefaults((prev) => ({
                    ...prev,
                    departmentId: value || undefined,
                  }));
                }}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">{t('programTitle')}</CardTitle>
            <CardDescription>{t('programDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <AcademicYearSelect
                label={t('academicYear')}
                value={academicYearId}
                onChange={setAcademicYearId}
              />
              <SemesterSelect
                label={t('defaultSemester')}
                value={semesterId}
                listParams={academicYearId ? { academicYearId } : undefined}
                onChange={setSemesterId}
              />
              <ProgramSelect
                btechOnly
                label={t('defaultProgram')}
                value={programId}
                onChange={setProgramId}
              />
              <DepartmentSelect
                label={t('defaultDepartment')}
                value={departmentId}
                onChange={setDepartmentId}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('programRows')}</p>
              {manualRows.map((row, index) => (
                <div key={index} className="flex flex-wrap items-end gap-2">
                  <Input
                    className="min-w-[120px] flex-1"
                    placeholder={t('courseCodePlaceholder')}
                    value={row.courseCode}
                    onChange={(e) => {
                      setManualRows((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, courseCode: e.target.value } : item,
                        ),
                      );
                    }}
                  />
                  <Input
                    className="min-w-[160px] flex-[2]"
                    placeholder={t('courseTitlePlaceholder')}
                    value={row.title}
                    onChange={(e) => {
                      setManualRows((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, title: e.target.value } : item,
                        ),
                      );
                    }}
                  />
                  <Input
                    className="w-20"
                    placeholder={t('creditsPlaceholder')}
                    value={row.credits}
                    onChange={(e) => {
                      setManualRows((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, credits: e.target.value } : item,
                        ),
                      );
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={manualRows.length <= 1}
                    onClick={() => {
                      setManualRows((prev) => prev.filter((_, i) => i !== index));
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => { setManualRows((prev) => [...prev, emptyManualRow()]); }}
              >
                <Plus className="size-4" />
                {t('addRow')}
              </Button>
            </div>
            <Button type="button" size="sm" onClick={() => void buildManualImport()}>
              <FileText className="size-4" />
              {t('previewProgramRows')}
            </Button>
          </CardContent>
        </Card>
      )}

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
          disabled={
            !preview || preview.invalidRows > 0 || importMutation.isPending || rows.length === 0
          }
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
      </div>
    </div>
  );
}
