import { Types } from 'mongoose';
import type { CertificateDocumentType, TranscriptCourseRow } from '@learnova/types';
import type { IssueCertificateInput } from '@learnova/validation';
import {
  activityKindForDocumentType,
  buildCourseCompletionPayload,
  buildTranscriptPayload,
  normalizeDocumentType,
  type CertificatePartyInfo,
} from '@learnova/shared';
import type { CourseGradeSummaryDocument } from '../../models/course-grade-summary.model.js';
import type { AcademicStandingDocument } from '../../models/academic-standing.model.js';

export interface CertificatePayloadBuildResult {
  documentPayload: Record<string, unknown>;
  courseGradeId: Types.ObjectId | null;
  snapshotVersion: number | null;
  standingRecordId: Types.ObjectId | null;
  activityKind: string | null;
}

function gradeFacts(summary: CourseGradeSummaryDocument) {
  return {
    letterGrade: summary.letterGrade ?? null,
    percentage: summary.percentage ?? null,
    gradePoints: summary.gradePoints ?? null,
    result: summary.result ?? null,
    publishedAt: summary.publishedAt?.toISOString() ?? null,
    snapshotVersion: summary.snapshotVersion ?? null,
  };
}

export function buildCertificatePayload(
  input: IssueCertificateInput,
  party: CertificatePartyInfo,
  eligibility: Record<string, unknown>,
  transcriptRows: TranscriptCourseRow[],
  extras?: {
    semesterGpa?: number | null;
    cgpa?: number | null;
    academicStanding?: string | null;
  },
): CertificatePayloadBuildResult {
  const type = normalizeDocumentType(input.documentType) as CertificateDocumentType;
  const activityKind = activityKindForDocumentType(input.documentType);

  if (type === 'course_completion' || activityKind) {
    const summary = eligibility.summary as CourseGradeSummaryDocument;
    const payload = buildCourseCompletionPayload(party, gradeFacts(summary));
    payload.type = input.documentType;
    if (activityKind) {
      payload.activity = { kind: activityKind, activityId: input.activityId ?? null };
    }
    return {
      documentPayload: payload,
      courseGradeId: summary._id,
      snapshotVersion: summary.snapshotVersion ?? null,
      standingRecordId: null,
      activityKind,
    };
  }

  if (type === 'semester_completion') {
    const payload = buildTranscriptPayload({
      party,
      semesterGpa: extras?.semesterGpa ?? null,
      cgpa: null,
      academicStanding: null,
      courses: transcriptRows,
    });
    payload.type = input.documentType === 'semester_record' ? 'semester_record' : 'semester_completion';
    return {
      documentPayload: payload,
      courseGradeId: null,
      snapshotVersion: null,
      standingRecordId: null,
      activityKind: null,
    };
  }

  if (type === 'program_completion' || type === 'graduation') {
    const payload = buildTranscriptPayload({
      party,
      semesterGpa: extras?.semesterGpa ?? null,
      cgpa: extras?.cgpa ?? null,
      academicStanding: extras?.academicStanding ?? null,
      courses: transcriptRows,
    });
    payload.type = type;
    return {
      documentPayload: payload,
      courseGradeId: null,
      snapshotVersion: null,
      standingRecordId: null,
      activityKind: null,
    };
  }

  if (type === 'merit' || input.documentType === 'honors' || input.documentType === 'distinction') {
    const standing = eligibility.standing as AcademicStandingDocument;
    return {
      documentPayload: {
        type: input.documentType,
        institution: { name: party.institutionName, logo: party.institutionLogo },
        student: {
          name: party.studentName,
          rollNumber: party.studentRollNumber,
          program: party.programName,
        },
        standing: standing.standing,
        disclaimer: 'Merit certificate issued from computed academic standing records.',
      },
      courseGradeId: null,
      snapshotVersion: null,
      standingRecordId: standing._id,
      activityKind: null,
    };
  }

  if (type === 'participation' || type === 'custom') {
    const summary = eligibility.summary as CourseGradeSummaryDocument;
    const payload = buildCourseCompletionPayload(party, gradeFacts(summary));
    payload.type = type;
    return {
      documentPayload: payload,
      courseGradeId: summary._id,
      snapshotVersion: summary.snapshotVersion ?? null,
      standingRecordId: null,
      activityKind: null,
    };
  }

  if (type === 'transcript') {
    const payload = buildTranscriptPayload({
      party,
      semesterGpa: extras?.semesterGpa ?? null,
      cgpa: extras?.cgpa ?? null,
      academicStanding: extras?.academicStanding ?? null,
      courses: transcriptRows,
    });
    return {
      documentPayload: payload,
      courseGradeId: null,
      snapshotVersion: null,
      standingRecordId: null,
      activityKind: null,
    };
  }

  throw new Error(`Unsupported document type: ${input.documentType}`);
}
