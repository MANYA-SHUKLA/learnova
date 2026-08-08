import { CERTIFICATE_DEFAULTS } from '@learnova/constants';
import type { CertificateDocumentType, TranscriptCourseRow } from '@learnova/types';

export interface CertificatePartyInfo {
  institutionName: string;
  institutionLogo: string | null;
  studentName: string;
  studentRollNumber: string | null;
  programName: string | null;
  courseTitle?: string | null;
  courseCode?: string | null;
  semesterLabel?: string | null;
}

export interface PublishedGradeFacts {
  letterGrade: string | null;
  percentage: number | null;
  gradePoints: number | null;
  result: string | null;
  publishedAt: string | null;
  snapshotVersion: number | null;
}

export function defaultTitleForDocumentType(type: CertificateDocumentType): string {
  switch (type) {
    case 'course_completion':
      return CERTIFICATE_DEFAULTS.TITLE_COURSE;
    case 'semester_record':
      return CERTIFICATE_DEFAULTS.TITLE_SEMESTER;
    case 'transcript':
      return CERTIFICATE_DEFAULTS.TITLE_TRANSCRIPT;
    case 'honors':
      return CERTIFICATE_DEFAULTS.TITLE_HONORS;
    case 'distinction':
      return CERTIFICATE_DEFAULTS.TITLE_DISTINCTION;
    default:
      return 'Academic Certificate';
  }
}

export function buildCourseCompletionPayload(
  party: CertificatePartyInfo,
  grade: PublishedGradeFacts,
  signatory?: { name: string | null; title: string | null },
): Record<string, unknown> {
  return {
    type: 'course_completion',
    institution: {
      name: party.institutionName,
      logo: party.institutionLogo,
    },
    student: {
      name: party.studentName,
      rollNumber: party.studentRollNumber,
      program: party.programName,
    },
    course: {
      title: party.courseTitle,
      code: party.courseCode,
    },
    grade: {
      letterGrade: grade.letterGrade,
      percentage: grade.percentage,
      gradePoints: grade.gradePoints,
      result: grade.result,
      publishedAt: grade.publishedAt,
      snapshotVersion: grade.snapshotVersion,
    },
    signatory: signatory ?? null,
    disclaimer:
      'This document is generated from published gradebook records. Learnova does not recalculate grades on certificates.',
  };
}

export function buildTranscriptPayload(input: {
  party: CertificatePartyInfo;
  semesterGpa: number | null;
  cgpa: number | null;
  academicStanding: string | null;
  courses: TranscriptCourseRow[];
}): Record<string, unknown> {
  return {
    type: 'transcript',
    institution: {
      name: input.party.institutionName,
      logo: input.party.institutionLogo,
    },
    student: {
      name: input.party.studentName,
      rollNumber: input.party.studentRollNumber,
      program: input.party.programName,
    },
    summary: {
      semesterGpa: input.semesterGpa,
      cgpa: input.cgpa,
      academicStanding: input.academicStanding,
      courseCount: input.courses.length,
    },
    courses: input.courses,
    disclaimer:
      'Official transcript derived exclusively from published gradebook entries. No grades are computed in the certificate module.',
  };
}
