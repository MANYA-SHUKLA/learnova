import type { Student } from '@learnova/types';

export function formatYearOfStudy(year: number | null | undefined): string | null {
  if (year == null || Number.isNaN(year)) return null;
  return `Year ${year}`;
}

export function buildStudentAcademicSummary(
  student: Pick<
    Student,
    | 'yearOfStudy'
    | 'currentSemester'
    | 'programId'
    | 'batchId'
    | 'semesterId'
    | 'sectionId'
    | 'academicYearId'
  > | null | undefined,
  labels: {
    program: (id: string | null | undefined) => string | null;
    batch: (id: string | null | undefined) => string | null;
    semester: (id: string | null | undefined) => string | null;
    section: (id: string | null | undefined) => string | null;
    year: (id: string | null | undefined) => string | null;
  },
): string | null {
  if (!student) return null;
  const parts: string[] = [];
  const yearOfStudy = formatYearOfStudy(student.yearOfStudy);
  if (yearOfStudy) parts.push(yearOfStudy);

  const section = labels.section(student.sectionId);
  if (section && section !== '—') parts.push(section);

  if (student.currentSemester != null) {
    parts.push(`Sem ${student.currentSemester}`);
  } else {
    const term = labels.semester(student.semesterId);
    if (term && term !== '—') parts.push(term);
  }

  const academicYear = labels.year(student.academicYearId);
  if (academicYear && academicYear !== '—') parts.push(academicYear);

  const program = labels.program(student.programId);
  if (program && program !== '—') parts.push(program);

  const batch = labels.batch(student.batchId);
  if (batch && batch !== '—') parts.push(batch);

  return parts.length > 0 ? parts.join(' · ') : null;
}
