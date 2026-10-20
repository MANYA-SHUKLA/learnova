import type { Student } from '@learnova/types';

export function formatYearOfStudy(year: number | null | undefined): string | null {
  if (year == null || Number.isNaN(year)) return null;
  return `Year ${year}`;
}

export function buildStudentAcademicSummary(
  student: Pick<
    Student,
    'yearOfStudy' | 'currentSemester' | 'programId' | 'batchId' | 'semesterId'
  > | null | undefined,
  labels: {
    program: (id: string | null | undefined) => string;
    batch: (id: string | null | undefined) => string;
    semester: (id: string | null | undefined) => string;
  },
): string | null {
  if (!student) return null;
  const parts: string[] = [];
  const year = formatYearOfStudy(student.yearOfStudy);
  if (year) parts.push(year);
  if (student.currentSemester != null) {
    parts.push(`Sem ${student.currentSemester}`);
  }
  const program = labels.program(student.programId);
  if (program && program !== '—') parts.push(program);
  const batch = labels.batch(student.batchId);
  if (batch && batch !== '—') parts.push(batch);
  const term = labels.semester(student.semesterId);
  if (term && term !== '—' && !parts.some((p) => p.includes(term))) {
    parts.push(term);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}
