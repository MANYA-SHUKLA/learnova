import type { Student, StudentAcademicDisplay } from '@learnova/types';

export function formatYearOfStudy(year: number | null | undefined): string | null {
  if (year == null || Number.isNaN(year)) return null;
  return `Year ${year}`;
}

function normalizePart(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function programBaseName(program: string): string {
  return program.split('(')[0]?.trim() ?? program;
}

/** Skip labels that repeat text already shown (e.g. batch name = program name). */
function isDuplicatePart(candidate: string, parts: string[]): boolean {
  const norm = normalizePart(candidate);
  for (const existing of parts) {
    const existingNorm = normalizePart(existing);
    if (existingNorm === norm) return true;
    if (existingNorm.includes(norm) || norm.includes(existingNorm)) {
      const shorter = existingNorm.length <= norm.length ? existingNorm : norm;
      const longer = shorter === existingNorm ? norm : existingNorm;
      if (longer.startsWith(shorter) && shorter.length >= 8) return true;
    }
  }
  return false;
}

function resolveProgramLabel(
  student: Pick<Student, 'programId' | 'academicDisplay'>,
  labels: { program: (id: string | null | undefined) => string | null },
): string | null {
  const display = student.academicDisplay;
  const fromDisplay = display?.program ?? display?.branch ?? null;
  if (fromDisplay) return fromDisplay;
  const fromCatalog = labels.program(student.programId);
  return fromCatalog && fromCatalog !== '—' ? fromCatalog : null;
}

function resolveSemesterLabel(
  student: Pick<Student, 'currentSemester' | 'semesterId' | 'academicDisplay'>,
  labels: { semester: (id: string | null | undefined) => string | null },
): string | null {
  const display = student.academicDisplay?.semester;
  if (display) return display;

  const term = labels.semester(student.semesterId);
  if (term && term !== '—') return term;

  if (student.currentSemester != null) {
    return `Sem ${student.currentSemester}`;
  }
  return null;
}

/** Section titles like "B.Tech CSE Sem I" duplicate program + semester lines. */
function sectionRepeatsProgramAndSemester(
  section: string,
  program: string | null,
  semester: string | null,
): boolean {
  if (!program) return false;
  const sectionNorm = normalizePart(section);
  const programNorm = normalizePart(programBaseName(program));
  if (!sectionNorm.includes(programNorm)) return false;
  if (!semester) return /sem(\s|$)/i.test(section);
  return true;
}

export function buildStudentAcademicSummary(
  student:
    | (Pick<
        Student,
        | 'yearOfStudy'
        | 'currentSemester'
        | 'programId'
        | 'batchId'
        | 'semesterId'
        | 'sectionId'
        | 'academicYearId'
      > & { academicDisplay?: StudentAcademicDisplay | null })
    | null
    | undefined,
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

  const program = resolveProgramLabel(student, labels);
  const semester = resolveSemesterLabel(student, labels);

  const section =
    student.academicDisplay?.section ?? labels.section(student.sectionId);
  const sectionLabel = section && section !== '—' ? section : null;

  if (sectionLabel && !sectionRepeatsProgramAndSemester(sectionLabel, program, semester)) {
    if (!isDuplicatePart(sectionLabel, parts)) parts.push(sectionLabel);
  }

  if (program && !isDuplicatePart(program, parts)) parts.push(program);

  if (semester && !isDuplicatePart(semester, parts)) parts.push(semester);

  const academicYear =
    student.academicDisplay?.academicYear ?? labels.year(student.academicYearId);
  if (academicYear && academicYear !== '—' && !isDuplicatePart(academicYear, parts)) {
    parts.push(academicYear);
  }

  const batch = student.academicDisplay?.batch ?? labels.batch(student.batchId);
  if (batch && batch !== '—' && !isDuplicatePart(batch, parts)) {
    parts.push(batch);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}
