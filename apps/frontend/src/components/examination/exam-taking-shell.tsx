'use client';

import { Button, Card, CardContent } from '@learnova/ui';
import { AlertTriangle, Clock3 } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ExamQuestion {
  id: string;
  question: string;
  options?: Array<{ id: string; optionText: string }>;
}

interface ExamTakingShellProps {
  title: string;
  subtitle?: string;
  remainingSeconds?: number | null;
  warnings?: string[];
  questions: ExamQuestion[];
  answers: Record<string, string[]>;
  onSelectOption: (questionId: string, optionId: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  headerActions?: ReactNode;
  children?: ReactNode;
}

function formatCountdown(seconds: number | null | undefined) {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ExamTakingShell({
  title,
  subtitle,
  remainingSeconds,
  warnings = [],
  questions,
  answers,
  onSelectOption,
  onSubmit,
  submitting,
  headerActions,
  children,
}: ExamTakingShellProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeQuestion = questions[activeIndex];
  const answeredCount = questions.filter((q) => (answers[q.id] ?? []).length > 0).length;
  const lowTime = remainingSeconds != null && remainingSeconds <= 300;

  const goToQuestion = useCallback(
    (index: number) => {
      setActiveIndex(Math.min(Math.max(0, index), Math.max(0, questions.length - 1)));
    },
    [questions.length],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        goToQuestion(activeIndex - 1);
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        goToQuestion(activeIndex + 1);
        return;
      }

      if (/^[1-9]$/.test(event.key) && activeQuestion) {
        const option = activeQuestion.options?.[Number(event.key) - 1];
        if (option) {
          event.preventDefault();
          onSelectOption(activeQuestion.id, option.id);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIndex, activeQuestion, goToQuestion, onSelectOption]);

  const liveMessage = activeQuestion
    ? `Question ${activeIndex + 1} of ${questions.length}. ${activeQuestion.question}`
    : 'No questions available.';

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>
      {remainingSeconds != null ? (
        <div aria-live="polite" className="sr-only">
          {lowTime ? 'Warning: less than five minutes remaining.' : ''}
          Time remaining: {formatCountdown(remainingSeconds)}
        </div>
      ) : null}

      <header className="border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-section-title">{title}</p>
            {subtitle ? <p className="truncate text-caption">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-3">
            <div
              role="timer"
              aria-label={`Time remaining ${formatCountdown(remainingSeconds)}`}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 tabular-nums text-label focus-within:ring-2 focus-within:ring-ring',
                lowTime
                  ? 'border-danger/30 bg-danger/10 text-danger'
                  : 'border-border/80 bg-muted/40 text-foreground',
              )}
            >
              <Clock3 className="size-4" aria-hidden />
              {formatCountdown(remainingSeconds)}
            </div>
            {headerActions}
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={questions.length ? Math.round((answeredCount / questions.length) * 100) : 0}
            aria-label="Exam progress"
          >
            <div
              className="h-full rounded-full bg-brand-gradient transition-all duration-500"
              style={{
                width: `${questions.length ? Math.round((answeredCount / questions.length) * 100) : 0}%`,
              }}
            />
          </div>
          <p className="mt-1 text-caption text-muted-foreground" aria-live="polite">
            {answeredCount} of {questions.length} answered
          </p>
        </div>
      </header>

      {warnings.length > 0 ? (
        <div
          className="border-b border-warning/30 bg-warning/10 px-4 py-2 sm:px-6"
          role="alert"
        >
          <p className="mx-auto flex max-w-6xl items-center gap-2 text-caption text-warning">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            {warnings.join(' · ')}
          </p>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 gap-0 overflow-hidden">
        <aside
          className="hidden w-56 shrink-0 overflow-y-auto border-r border-border/80 bg-muted/20 p-4 lg:block"
          aria-label="Question palette"
        >
          <p className="mb-3 text-label text-muted-foreground" id="exam-question-palette-label">
            Questions
          </p>
          <div className="grid grid-cols-4 gap-2" role="list">
            {questions.map((q, index) => {
              const answered = (answers[q.id] ?? []).length > 0;
              const active = index === activeIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  role="listitem"
                  aria-label={`Question ${index + 1}${answered ? ', answered' : ', unanswered'}`}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => goToQuestion(index)}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg border text-caption font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    active && 'border-primary bg-primary text-primary-foreground',
                    !active && answered && 'border-success/40 bg-success/10 text-success',
                    !active && !answered && 'border-border bg-background hover:bg-muted',
                  )}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6" aria-labelledby="exam-active-question-label">
          {children}
          {activeQuestion ? (
            <Card className="max-w-3xl border-border/80 shadow-soft-md">
              <CardContent className="space-y-6 p-6">
                <div>
                  <p className="text-meta text-primary" id="exam-active-question-label">
                    Question {activeIndex + 1}
                  </p>
                  <h2 className="mt-2 text-section-title">{activeQuestion.question}</h2>
                </div>
                <div
                  className="space-y-2"
                  role="radiogroup"
                  aria-labelledby="exam-active-question-label"
                >
                  {(activeQuestion.options ?? []).map((opt, optionIndex) => {
                    const selected = (answers[activeQuestion.id] ?? []).includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`Option ${optionIndex + 1}: ${opt.optionText}`}
                        className={cn(
                          'w-full rounded-xl border px-4 py-3 text-left text-body transition-all',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          selected
                            ? 'border-primary bg-primary/5 shadow-soft-sm'
                            : 'border-border/80 hover:border-primary/40 hover:bg-muted/30',
                        )}
                        onClick={() => onSelectOption(activeQuestion.id, opt.id)}
                      >
                        <span className="mr-2 tabular-nums text-muted-foreground">{optionIndex + 1}.</span>
                        {opt.optionText}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={activeIndex === 0}
                    onClick={() => goToQuestion(activeIndex - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={activeIndex >= questions.length - 1}
                    onClick={() => goToQuestion(activeIndex + 1)}
                  >
                    Next
                  </Button>
                  <Button
                    type="button"
                    className="ml-auto rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={submitting}
                    onClick={onSubmit}
                  >
                    {submitting ? 'Submitting…' : 'Submit exam'}
                  </Button>
                </div>
                <p className="text-caption text-muted-foreground">
                  Keyboard: arrow keys to move between questions, number keys to select an option.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </main>
      </div>
    </div>
  );
}
