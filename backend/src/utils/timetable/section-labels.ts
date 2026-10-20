import { SECTION_PLANS } from '../../seeds/monsoon-2026/schedules.js';

/** Legacy curriculum-check cohort names (duplicate Monsoon sections). */
export const LEGACY_YEAR_SECTION_NAME = /^(CSE|ECE) Year \d+$|^Year \d+$/;

export function isLegacyYearSectionName(name: string): boolean {
  return LEGACY_YEAR_SECTION_NAME.test(name.trim());
}

export function canonicalSectionLabel(
  programCode: string,
  semesterNumber: number,
): string | undefined {
  return SECTION_PLANS.find(
    (p) => p.programCode === programCode && p.semesterNumber === semesterNumber,
  )?.sectionLabel;
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'] as const;

/** B.Tech section label when not in Monsoon SECTION_PLANS (e.g. even terms II, IV, …). */
export function bTechSectionLabel(branch: 'CSE' | 'ECE', semesterNumber: number): string {
  const roman = ROMAN[semesterNumber] ?? String(semesterNumber);
  return `B.Tech ${branch} Sem ${roman}`;
}
