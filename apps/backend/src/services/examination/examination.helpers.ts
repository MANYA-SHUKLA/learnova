import type { ExamStatus } from '@learnova/types';
import { ASSESSMENT_ENROLLMENT_STATUSES } from '@learnova/constants';
import { computePercentage, isPassing } from '@learnova/shared';

/** @deprecated Prefer ASSESSMENT_ENROLLMENT_STATUSES from @learnova/constants */
export const ACTIVE_ENROLLMENT_STATUSES = ASSESSMENT_ENROLLMENT_STATUSES;

export const EXAM_STATUS_TRANSITIONS: Record<ExamStatus, ExamStatus[]> = {
  draft: ['scheduled', 'published', 'archived'],
  scheduled: ['published', 'cancelled', 'archived'],
  published: ['in_progress', 'cancelled', 'archived'],
  in_progress: ['completed', 'cancelled'],
  completed: ['archived'],
  archived: ['draft'],
  cancelled: ['draft'],
};

export function canTransitionExamStatus(from: ExamStatus, to: ExamStatus): boolean {
  return EXAM_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export { computePercentage, isPassing };

export function pageMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function ensureUniqueExamSlug(
  _institutionId: string,
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 0;
  while (await exists(slug)) {
    suffix += 1;
    slug = `${baseSlug}-${String(suffix)}`;
  }
  return slug;
}

export function toExamScheduleDto(schedule: {
  registrationOpensAt?: Date | null;
  registrationClosesAt?: Date | null;
  checkInOpensAt?: Date | null;
  startsAt: Date;
  endsAt: Date;
  lateEntryMinutes: number;
  gracePeriodMinutes: number;
}) {
  return {
    registrationOpensAt: schedule.registrationOpensAt?.toISOString() ?? null,
    registrationClosesAt: schedule.registrationClosesAt?.toISOString() ?? null,
    checkInOpensAt: schedule.checkInOpensAt?.toISOString() ?? null,
    startsAt: schedule.startsAt.toISOString(),
    endsAt: schedule.endsAt.toISOString(),
    lateEntryMinutes: schedule.lateEntryMinutes,
    gracePeriodMinutes: schedule.gracePeriodMinutes,
  };
}

export function isExamPublished(status: ExamStatus): boolean {
  return ['published', 'in_progress', 'completed'].includes(status);
}

export function isExamActive(status: ExamStatus): boolean {
  return status === 'in_progress';
}
