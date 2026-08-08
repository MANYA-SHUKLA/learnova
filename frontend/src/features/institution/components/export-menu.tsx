'use client';

import { Button } from '@learnova/ui';
import { Download, Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { exportToCsv, type CsvCell } from '../utils/export';

interface ExportMenuProps {
  filename: string;
  headers: string[];
  rows: CsvCell[][];
  disabled?: boolean;
}

export function ExportMenu({ filename, headers, rows, disabled }: ExportMenuProps) {
  const t = useTranslations('dashboard.institution.crud');
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={Boolean(disabled) || rows.length === 0}
        onClick={() => { exportToCsv(filename, headers, rows); }}
      >
        <Download className="size-3.5" />
        CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => { window.print(); }}
      >
        <Printer className="size-3.5" />
        {t('printPdf')}
      </Button>
    </div>
  );
}
