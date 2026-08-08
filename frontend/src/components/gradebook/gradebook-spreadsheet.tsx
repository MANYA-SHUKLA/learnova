'use client';

import { StatusBadge } from '@learnova/ui';
import type { GradebookEntry } from '@learnova/types';
import { cn } from '@/lib/utils';
import {
  formatActivityKind,
  formatMarks,
  formatPercentage,
} from '@/features/gradebook';

interface GradebookSpreadsheetProps {
  rows: GradebookEntry[];
  loading?: boolean;
  frozenLabel?: string;
}

export function GradebookSpreadsheet({
  rows,
  loading,
  frozenLabel = 'Activity',
}: GradebookSpreadsheetProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-soft-sm">
        <div className="h-48 animate-pulse bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-soft-sm">
      <div className="max-h-[min(70vh,32rem)] overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur-sm">
            <tr className="border-b border-border/80">
              <th
                scope="col"
                className="sticky left-0 z-30 min-w-[14rem] border-r border-border/80 bg-muted/95 px-4 py-3 text-left text-label font-medium text-muted-foreground"
              >
                {frozenLabel}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-label font-medium text-muted-foreground">
                Type
              </th>
              <th scope="col" className="px-4 py-3 text-left text-label font-medium text-muted-foreground">
                Marks
              </th>
              <th scope="col" className="px-4 py-3 text-left text-label font-medium text-muted-foreground">
                Score
              </th>
              <th scope="col" className="px-4 py-3 text-left text-label font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry, index) => (
              <tr
                key={entry.id}
                className={cn(
                  'border-b border-border/60 transition-colors hover:bg-muted/30',
                  index % 2 === 1 && 'bg-muted/10',
                )}
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-border/80 bg-card px-4 py-3 text-left font-medium text-foreground"
                >
                  {entry.activityTitle}
                </th>
                <td className="px-4 py-3 text-caption">{formatActivityKind(entry.activityKind)}</td>
                <td className="px-4 py-3 tabular-nums">
                  {formatMarks(entry.marksObtained, entry.totalMarks)}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatPercentage(entry.percentage)}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={
                      entry.passed == null
                        ? entry.status
                        : entry.passed
                          ? 'completed'
                          : 'rejected'
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
