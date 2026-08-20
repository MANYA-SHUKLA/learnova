'use client';

import { Button, Input, Spinner } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState, type ReactNode, type SyntheticEvent } from 'react';
import { cn } from '@/lib/utils';

export type FormFieldType =
  | 'text'
  | 'email'
  | 'url'
  | 'number'
  | 'date'
  | 'time'
  | 'textarea'
  | 'select'
  | 'checkbox';

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}

interface ResourceFormDialogProps {
  open: boolean;
  title: string;
  description?: string;
  fields: FormField[];
  initialValues?: Record<string, string | number | boolean | null | undefined>;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: Record<string, string | number | boolean | null>) => void | Promise<void>;
  children?: ReactNode;
}

const selectClassName = cn(
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
);

const textareaClassName = cn(
  'flex min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
);

function buildDefaults(
  fields: FormField[],
  initialValues?: ResourceFormDialogProps['initialValues'],
): Record<string, string | number | boolean | null> {
  const values: Record<string, string | number | boolean | null> = {};
  for (const field of fields) {
    const raw = initialValues?.[field.name];
    if (field.type === 'checkbox') {
      values[field.name] = Boolean(raw);
    } else if (field.type === 'number') {
      values[field.name] =
        raw === undefined || raw === null || raw === '' ? null : Number(raw);
    } else if (raw === undefined || raw === null) {
      values[field.name] = field.type === 'select' && field.options?.[0] ? field.options[0].value : '';
    } else {
      values[field.name] = String(raw);
    }
  }
  return values;
}

export function ResourceFormDialog({
  open,
  title,
  description,
  fields,
  initialValues,
  submitLabel,
  isSubmitting,
  error,
  onClose,
  onSubmit,
  children,
}: ResourceFormDialogProps) {
  const tCommon = useTranslations('common');
  const tCrud = useTranslations('dashboard.institution.crud');
  const resolvedSubmitLabel = submitLabel ?? tCommon('save');
  const titleId = useId();
  const [values, setValues] = useState(() => buildDefaults(fields, initialValues));

  useEffect(() => {
    if (open) {
      setValues(buildDefaults(fields, initialValues));
    }
  }, [open, fields, initialValues]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    await onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center print:hidden">
      <button
        type="button"
        aria-label={tCrud('closeDialog')}
        className="absolute inset-0 bg-foreground/40"
        disabled={isSubmitting}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[min(90vh,100dvh)] w-full max-w-full overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-lg sm:max-w-2xl sm:rounded-2xl sm:p-6"
      >
        <div className="mb-5">
          <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          {fields.map((field) => {
            const id = `${titleId}-${field.name}`;
            if (field.type === 'checkbox') {
              return (
                <label key={field.name} htmlFor={id} className="flex items-center gap-2 text-sm">
                  <input
                    id={id}
                    type="checkbox"
                    checked={Boolean(values[field.name])}
                    disabled={isSubmitting}
                    onChange={(e) =>
                      { setValues((prev) => ({ ...prev, [field.name]: e.target.checked })); }
                    }
                    className="size-4 rounded border-input"
                  />
                  {field.label}
                </label>
              );
            }

            return (
              <div key={field.name} className="space-y-1.5">
                <label htmlFor={id} className="text-sm font-medium">
                  {field.label}
                  {field.required ? <span className="text-danger"> *</span> : null}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={id}
                    className={textareaClassName}
                    required={field.required}
                    disabled={isSubmitting}
                    placeholder={field.placeholder}
                    value={String(values[field.name] ?? '')}
                    onChange={(e) =>
                      { setValues((prev) => ({ ...prev, [field.name]: e.target.value })); }
                    }
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={id}
                    className={selectClassName}
                    required={field.required}
                    disabled={isSubmitting}
                    value={String(values[field.name] ?? '')}
                    onChange={(e) =>
                      { setValues((prev) => ({ ...prev, [field.name]: e.target.value })); }
                    }
                  >
                    {(field.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={id}
                    type={field.type}
                    required={field.required}
                    disabled={isSubmitting}
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={
                      values[field.name] === null || values[field.name] === undefined
                        ? ''
                        : String(values[field.name])
                    }
                    onChange={(e) => {
                      const next =
                        field.type === 'number'
                          ? e.target.value === ''
                            ? null
                            : Number(e.target.value)
                          : e.target.value;
                      setValues((prev) => ({ ...prev, [field.name]: next }));
                    }}
                  />
                )}
                {field.hint ? (
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                ) : null}
              </div>
            );
          })}

          {children}

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  {tCrud('saving')}
                </>
              ) : (
                resolvedSubmitLabel
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
