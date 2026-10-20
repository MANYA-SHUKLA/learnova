'use client';

import { Button, Input } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { Assignment } from '@learnova/types';

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface AssignmentExtendDueDialogProps {
  assignment: Assignment;
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (dueDate: string | null, closeDate: string | null) => void;
}

export function AssignmentExtendDueDialog({
  assignment,
  open,
  pending,
  onOpenChange,
  onSave,
}: AssignmentExtendDueDialogProps) {
  const t = useTranslations('dashboard.faculty.assignments');
  const [dueDate, setDueDate] = useState('');
  const [closeDate, setCloseDate] = useState('');

  useEffect(() => {
    if (open) {
      setDueDate(toDatetimeLocalValue(assignment.dueDate));
      setCloseDate(toDatetimeLocalValue(assignment.closeDate));
    }
  }, [open, assignment.dueDate, assignment.closeDate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-background p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold">{t('extendTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('extendDescription')}</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="extend-due" className="text-sm font-medium">
              {t('dueDate')}
            </label>
            <Input
              id="extend-due"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="extend-close" className="text-sm font-medium">
              {t('closeDate')}
            </label>
            <Input
              id="extend-close"
              type="datetime-local"
              value={closeDate}
              onChange={(e) => { setCloseDate(e.target.value); }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => { onOpenChange(false); }}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              onSave(
                dueDate ? new Date(dueDate).toISOString() : null,
                closeDate ? new Date(closeDate).toISOString() : null,
              );
            }}
          >
            {pending ? t('saving') : t('saveExtend')}
          </Button>
        </div>
      </div>
    </div>
  );
}
