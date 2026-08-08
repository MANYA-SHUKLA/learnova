import * as React from 'react';
import { cn } from '../../lib/utils';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  const hintId = hint ? `${htmlFor ?? label}-hint` : undefined;
  const errorId = error ? `${htmlFor ?? label}-error` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={htmlFor} className="text-label text-foreground">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-caption text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function FormSection({ title, description, children, className, actions }: FormSectionProps) {
  return (
    <section className={cn('space-y-6 rounded-xl border border-border/80 bg-card p-6 shadow-soft-sm', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-section-title text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-caption text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
