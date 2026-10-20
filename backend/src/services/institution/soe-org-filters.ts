import type { FilterQuery } from 'mongoose';

/** B.Tech branches only — excludes M.Tech, Ph.D, and other postgrad/doctoral rows. */
export function btechProgramListFilter(): FilterQuery<unknown> {
  return {
    code: { $regex: /^BT-/i },
    level: 'undergraduate',
  };
}

export function isOptionalSoeProgram(code: string, level: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (/^MT-/.test(normalized) || normalized === 'PHD') return true;
  return level === 'postgraduate' || level === 'doctoral';
}
