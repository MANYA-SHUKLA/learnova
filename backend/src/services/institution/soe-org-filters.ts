import type { FilterQuery } from 'mongoose';

/** SOE JNU “Degree programs” page — B.Tech CSE & ECE only (not Mathematics / Ph.D rows). */
export const SOE_EXCLUDED_DEGREE_DEPARTMENT_CODES = ['MATH', 'PHD'] as const;

/** B.Tech branches only — excludes M.Tech, Ph.D, and other postgrad/doctoral rows. */
export function btechProgramListFilter(): FilterQuery<unknown> {
  return {
    code: { $regex: /^BT-/i },
    level: 'undergraduate',
  };
}

export function soeDegreeDepartmentListFilter(): FilterQuery<unknown> {
  return {
    code: { $nin: [...SOE_EXCLUDED_DEGREE_DEPARTMENT_CODES] },
  };
}

export function isExcludedSoeDegreeDepartment(code: string): boolean {
  return SOE_EXCLUDED_DEGREE_DEPARTMENT_CODES.includes(
    code.trim().toUpperCase() as (typeof SOE_EXCLUDED_DEGREE_DEPARTMENT_CODES)[number],
  );
}

export function isOptionalSoeProgram(code: string, level: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (/^MT-/.test(normalized) || normalized === 'PHD') return true;
  return level === 'postgraduate' || level === 'doctoral';
}
