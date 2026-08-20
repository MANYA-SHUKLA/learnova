'use client';

import type { TimetableDayOfWeek, TimetableSlot } from '@learnova/types';
import { cn } from '@learnova/ui';
import { useMemo } from 'react';

const DEFAULT_GRID_DAYS: TimetableDayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const DAY_COLORS: Record<TimetableDayOfWeek, { header: string; cell: string }> = {
  mon: { header: 'bg-orange-500 text-white', cell: 'bg-orange-50' },
  tue: { header: 'bg-yellow-400 text-yellow-950', cell: 'bg-yellow-50' },
  wed: { header: 'bg-emerald-500 text-white', cell: 'bg-emerald-50' },
  thu: { header: 'bg-cyan-500 text-white', cell: 'bg-cyan-50' },
  fri: { header: 'bg-blue-500 text-white', cell: 'bg-blue-50' },
  sat: { header: 'bg-violet-500 text-white', cell: 'bg-violet-50' },
  sun: { header: 'bg-pink-500 text-white', cell: 'bg-pink-50' },
};

function slotTimeKey(slot: TimetableSlot): string {
  return `${slot.startTime}|${slot.endTime}`;
}

function buildTimeRows(slots: TimetableSlot[]): string[] {
  const keys = new Set(slots.map(slotTimeKey));
  return [...keys].sort((a, b) => {
    const startA = a.split('|')[0] ?? '';
    const startB = b.split('|')[0] ?? '';
    return startA.localeCompare(startB);
  });
}

function formatTimeRange(timeKey: string): string {
  const [start, end] = timeKey.split('|');
  return `${start} – ${end}`;
}

function slotsAt(slots: TimetableSlot[], day: TimetableDayOfWeek, timeKey: string): TimetableSlot[] {
  const [start, end] = timeKey.split('|');
  return slots.filter(
    (slot) => slot.dayOfWeek === day && slot.startTime === start && slot.endTime === end,
  );
}

function TimetableCell({ slots }: { slots: TimetableSlot[] }) {
  if (slots.length === 0) return null;

  return (
    <div className="space-y-2">
      {slots.map((slot) => (
        <div
          key={slot.id}
          className="rounded-lg border border-white/80 bg-white/70 p-2 shadow-sm backdrop-blur-sm"
        >
          <p className="text-sm font-semibold leading-tight text-foreground">{slot.courseTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{slot.sectionName}</p>
          <p className="text-xs font-medium text-foreground/80">{slot.room}</p>
          <p className="text-[11px] text-muted-foreground">{slot.facultyName}</p>
        </div>
      ))}
    </div>
  );
}

export interface WeeklyTimetableGridProps {
  slots: TimetableSlot[];
  dayLabels: Record<TimetableDayOfWeek, string>;
  timeColumnLabel: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function WeeklyTimetableGrid({
  slots,
  dayLabels,
  timeColumnLabel,
  title,
  subtitle,
  className,
}: WeeklyTimetableGridProps) {
  const gridDays = useMemo(() => {
    const days = [...DEFAULT_GRID_DAYS];
    if (slots.some((slot) => slot.dayOfWeek === 'sun') && !days.includes('sun')) {
      days.push('sun');
    }
    return days;
  }, [slots]);

  const timeRows = useMemo(() => buildTimeRows(slots), [slots]);

  return (
    <div
      className={cn(
        'timetable-grid relative overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-br from-sky-50 via-amber-50 to-rose-50 p-4 shadow-soft-md sm:p-6',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-3 top-3 text-2xl opacity-40 sm:text-3xl"
      >
        📚
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute right-4 top-2 text-2xl opacity-40 sm:text-3xl"
      >
        ✏️
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-3 left-4 text-2xl opacity-40 sm:text-3xl"
      >
        🎨
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-4 right-6 text-2xl opacity-40 sm:text-3xl"
      >
        🌍
      </div>

      {title ? (
        <div className="relative z-10 mb-4 flex flex-col items-center gap-1 text-center sm:mb-6">
          <div className="inline-block rounded-2xl border-2 border-orange-200 bg-orange-100/90 px-6 py-2 shadow-sm">
            <h2 className="text-xl font-bold tracking-wide text-violet-900 sm:text-2xl">{title}</h2>
          </div>
          {subtitle ? <p className="text-sm font-medium text-muted-foreground">{subtitle}</p> : null}
        </div>
      ) : null}

      <div className="relative z-10 overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="rounded-tl-xl bg-pink-500 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-white sm:px-4 sm:text-sm">
                {timeColumnLabel}
              </th>
              {gridDays.map((day, index) => (
                <th
                  key={day}
                  className={cn(
                    'px-3 py-3 text-center text-xs font-bold sm:px-4 sm:text-sm',
                    DAY_COLORS[day].header,
                    index === gridDays.length - 1 ? 'rounded-tr-xl' : '',
                  )}
                >
                  {dayLabels[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeRows.length === 0 ? (
              <tr>
                <td
                  colSpan={gridDays.length + 1}
                  className="rounded-xl bg-white/80 px-4 py-8 text-center text-muted-foreground"
                >
                  —
                </td>
              </tr>
            ) : (
              timeRows.map((timeKey, rowIndex) => (
                <tr key={timeKey}>
                  <td
                    className={cn(
                      'bg-pink-50 px-3 py-3 text-center align-middle font-semibold text-pink-900 sm:px-4',
                      rowIndex === timeRows.length - 1 ? 'rounded-bl-xl' : '',
                    )}
                  >
                    {formatTimeRange(timeKey)}
                  </td>
                  {gridDays.map((day, colIndex) => {
                    const cellSlots = slotsAt(slots, day, timeKey);
                    return (
                      <td
                        key={day}
                        className={cn(
                          'min-w-[120px] px-2 py-2 align-top sm:min-w-[140px] sm:px-3 sm:py-3',
                          DAY_COLORS[day].cell,
                          rowIndex === timeRows.length - 1 && colIndex === gridDays.length - 1
                            ? 'rounded-br-xl'
                            : '',
                        )}
                      >
                        <TimetableCell slots={cellSlots} />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
