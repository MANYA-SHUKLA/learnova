'use client';

import { Button, Spinner } from '@learnova/ui';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FormStep {
  id: string;
  label: string;
  description?: string;
}

interface FormStepperProps {
  steps: FormStep[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  className?: string;
}

export function FormStepper({ steps, currentStep, onStepChange, className }: FormStepperProps) {
  return (
    <nav aria-label="Form progress" className={cn('mb-6', className)}>
      <ol className="flex flex-wrap gap-2">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          const canNavigate = onStepChange && index <= currentStep;

          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!canNavigate}
                onClick={() => onStepChange?.(index)}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive && 'border-primary bg-primary/10 text-primary',
                  isComplete && 'border-success/40 bg-success/5 text-success',
                  !isActive && !isComplete && 'border-border text-muted-foreground',
                  !canNavigate && 'cursor-default opacity-80',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isActive && 'bg-primary text-primary-foreground',
                    isComplete && 'bg-success/20 text-success',
                    !isActive && !isComplete && 'bg-muted',
                  )}
                >
                  {isComplete ? <Check className="size-3.5" aria-hidden /> : index + 1}
                </span>
                <span className="font-medium">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface FormStepperNavProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  nextLabel?: string;
  previousLabel?: string;
  canProceed?: boolean;
  extra?: ReactNode;
}

export function FormStepperNav({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
  submitLabel = 'Submit',
  nextLabel = 'Next',
  previousLabel = 'Previous',
  canProceed = true,
  extra,
}: FormStepperNavProps) {
  const isLast = currentStep >= totalSteps - 1;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        disabled={currentStep === 0 || isSubmitting}
        onClick={onPrevious}
      >
        {previousLabel}
      </Button>
      {!isLast ? (
        <Button
          type="button"
          className="rounded-xl"
          disabled={!canProceed || isSubmitting}
          onClick={onNext}
        >
          {nextLabel}
        </Button>
      ) : (
        <Button
          type="button"
          className="rounded-xl"
          disabled={!canProceed || isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" />
              {submitLabel}…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      )}
      {extra}
    </div>
  );
}

export function FormDraftStatus({
  lastSavedAt,
  visible,
}: {
  lastSavedAt: Date | null;
  visible?: boolean;
}) {
  if (!visible || !lastSavedAt) return null;

  return (
    <p className="text-caption text-muted-foreground" role="status" aria-live="polite">
      Draft saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </p>
  );
}
