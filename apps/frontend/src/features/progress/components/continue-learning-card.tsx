'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { ArrowRight, Clock3, PlayCircle } from 'lucide-react';
import { Link } from '@/lib/i18n/routing';
import { formatMinutes, formatPercent } from '../lib/labels';

export interface ContinueLearningItem {
  courseId: string;
  courseTitle: string;
  progressPercentage: number;
  currentModuleId: string | null;
  currentLessonId: string | null;
  estimatedRemainingMinutes: number;
}

interface ContinueLearningCardProps {
  items: ContinueLearningItem[];
  title?: string;
  description?: string;
  emptyLabel?: string;
  resumeLabel?: string;
}

export function ContinueLearningCard({
  items,
  title = 'Continue learning',
  description = 'Pick up where you left off.',
  emptyLabel = 'No courses in progress yet.',
  resumeLabel = 'Resume',
}: ContinueLearningCardProps) {
  return (
    <Card className="rounded-2xl border-border/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.map((item) => {
            const href = APP_ROUTES.STUDENT_PROGRESS_COURSE.replace(':id', item.courseId);
            return (
              <div
                key={item.courseId}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{item.courseTitle}</p>
                    <Badge variant="secondary">{formatPercent(item.progressPercentage)}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3.5" />
                      {formatMinutes(item.estimatedRemainingMinutes)} remaining
                    </span>
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, item.progressPercentage))}%` }}
                      />
                    </div>
                  </div>
                </div>
                <Button asChild size="sm" className="shrink-0">
                  <Link href={href}>
                    <PlayCircle className="size-4" />
                    {resumeLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
