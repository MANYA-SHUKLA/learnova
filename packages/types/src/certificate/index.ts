import type { ID } from '../common/index.js';

export type CertificateDocumentType =
  | 'course_completion'
  | 'semester_record'
  | 'transcript'
  | 'honors'
  | 'distinction';

export type CertificateStatus = 'draft' | 'issued' | 'revoked' | 'expired';

export type TranscriptStatus = 'draft' | 'issued' | 'revoked';

export interface CertificateTemplate {
  id: ID;
  institutionId: ID;
  name: string;
  documentType: CertificateDocumentType;
  titleTemplate: string;
  bodyTemplate: string;
  footerTemplate: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GradebookReference {
  courseGradeId: ID | null;
  snapshotVersion: number | null;
  semesterId: ID | null;
  programId: ID | null;
  standingRecordId: ID | null;
}

export interface AcademicCertificate {
  id: ID;
  institutionId: ID;
  studentId: ID;
  documentType: CertificateDocumentType;
  templateId: ID | null;
  courseId: ID | null;
  courseGradeId: ID | null;
  semesterId: ID | null;
  programId: ID | null;
  verificationCode: string;
  status: CertificateStatus;
  title: string;
  documentPayload: Record<string, unknown>;
  gradebookReference: GradebookReference;
  issuedAt: string | null;
  issuedBy: ID | null;
  revokedAt: string | null;
  revokedBy: ID | null;
  revocationReason: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptCourseRow {
  courseId: ID;
  courseCode: string | null;
  courseTitle: string;
  credits: number;
  letterGrade: string | null;
  gradePoints: number | null;
  percentage: number | null;
  result: string | null;
  semesterId: ID | null;
  publishedAt: string | null;
}

export interface AcademicTranscript {
  id: ID;
  institutionId: ID;
  studentId: ID;
  programId: ID | null;
  semesterId: ID | null;
  verificationCode: string;
  status: TranscriptStatus;
  semesterGpa: number | null;
  cgpa: number | null;
  academicStanding: string | null;
  courses: TranscriptCourseRow[];
  documentPayload: Record<string, unknown>;
  issuedAt: string | null;
  issuedBy: ID | null;
  revokedAt: string | null;
  revokedBy: ID | null;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateVerificationResult {
  valid: boolean;
  status: CertificateStatus | TranscriptStatus | null;
  documentType: CertificateDocumentType | 'transcript' | null;
  institutionName: string | null;
  studentName: string | null;
  title: string | null;
  issuedAt: string | null;
  revokedAt: string | null;
  message: string;
}

export interface CertificateEligibilityResult {
  eligible: boolean;
  reasons: string[];
  courseGradeId?: ID;
  snapshotVersion?: number;
}

export interface CertificateDashboardStats {
  issuedCount: number;
  revokedCount: number;
  pendingEligible: number;
  transcriptCount: number;
}
