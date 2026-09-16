'use client';

import { Button, Spinner } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState, type SyntheticEvent } from 'react';

export interface GenerateTimetableDialogProps {
  open: boolean;
  semesterName: string;
  academicYearName: string;
  hasExistingSlots: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: { notes: string; replaceExisting: boolean }) => void | Promise<void>;
}

export function GenerateTimetableDialog({
  open,
  semesterName,
  academicYearName,
  hasExistingSlots,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: GenerateTimetableDialogProps) {
  const t = useTranslations('dashboard.timetable');
  const tCommon = useTranslations('common');
  const titleId = useId();
  const notesId = `${titleId}-notes`;
  const replaceId = `${titleId}-replace`;
  const [notes, setNotes] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);

  useEffect(() => {
    if (open) {
      setNotes('');
      setReplaceExisting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (hasExistingSlots && !replaceExisting) return;
    await onSubmit({ notes: notes.trim(), replaceExisting: hasExistingSlots ? replaceExisting : false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center print:hidden">
      <button
        type="button"
        aria-label={tCommon('close')}
        className="absolute inset-0 bg-foreground/40"
        disabled={isSubmitting}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[min(90vh,100dvh)] w-full max-w-full overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-lg sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        <div className="mb-5">
          <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight">
            {t('generateTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('generateDescription', { semester: semesterName, year: academicYearName })}
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-1.5">
            <label htmlFor={notesId} className="text-sm font-medium">
              {t('generateNotes')}
            </label>
            <textarea
              id={notesId}
              className="flex min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              maxLength={500}
              placeholder={t('generateNotesPlaceholder')}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
              }}
            />
          </div>

          {hasExistingSlots ? (
            <label htmlFor={replaceId} className="flex items-start gap-2 text-sm">
              <input
                id={replaceId}
                type="checkbox"
                className="mt-0.5 size-4 rounded border-input"
                checked={replaceExisting}
                disabled={isSubmitting}
                onChange={(e) => {
                  setReplaceExisting(e.target.checked);
                }}
              />
              <span>
                {t('generateReplace')}
                <span className="mt-0.5 block text-xs text-muted-foreground">{t('generateReplaceHint')}</span>
              </span>
            </label>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || (hasExistingSlots && !replaceExisting)}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  {t('generating')}
                </>
              ) : (
                t('generateSubmit')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
