import type { ID } from '../common/index.js';

export type CertificateDocumentType =
  | 'course_completion'
  | 'lab_completion'
  | 'project_completion'
  | 'quiz_completion'
  | 'exam_completion'
  | 'semester_completion'
  | 'program_completion'
  | 'graduation'
  | 'merit'
  | 'participation'
  | 'custom'
  | 'semester_record'
  | 'transcript'
  | 'honors'
  | 'distinction';

export type CertificateStatus =
  | 'draft'
  | 'generated'
  | 'issued'
  | 'published'
  | 'revoked'
  | 'archived'
  | 'expired';

export type TranscriptType = 'semester' | 'complete' | 'course_wise' | 'official';

export type TranscriptStatus = 'draft' | 'issued' | 'published' | 'revoked' | 'archived';

export type CertificateSignatureRole = 'institution' | 'registrar' | 'dean' | 'faculty';

export interface CertificateTemplateDesign {
  headerHtml: string | null;
  footerHtml: string | null;
  logoUrl: string | null;
  sealUrl: string | null;
  watermarkText: string | null;
  backgroundColor: string | null;
  primaryColor: string | null;
  fontFamily: string | null;
}

export interface CertificateTemplateSignature {
  role: CertificateSignatureRole;
  name: string;
  title: string;
  imageUrl: string | null;
}

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
  design: CertificateTemplateDesign;
  signatures: CertificateTemplateSignature[];
  numberPrefix: string | null;
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
  activityId: ID | null;
  activityKind: string | null;
}

export interface AcademicCertificate {
  id: ID;
  institutionId: ID;
  studentId: ID;
  certificateNumber: string;
  documentType: CertificateDocumentType;
  templateId: ID | null;
  courseId: ID | null;
  courseGradeId: ID | null;
  activityId: ID | null;
  activityKind: string | null;
  semesterId: ID | null;
  programId: ID | null;
  verificationCode: string;
  verificationURL: string;
  status: CertificateStatus;
  revoked: boolean;
  title: string;
  version: number;
  rootCertificateId: ID | null;
  documentPayload: Record<string, unknown>;
  gradebookReference: GradebookReference;
  issueDate: string | null;
  issuedAt: string | null;
  issuedBy: ID | null;
  publishedAt: string | null;
  revokedAt: string | null;
  revokedBy: ID | null;
  revocationReason: string | null;
  archivedAt: string | null;
  downloadCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateSignature {
  id: ID;
  institutionId: ID;
  certificateId: ID;
  role: CertificateSignatureRole;
  name: string;
  title: string;
  imageUrl: string | null;
  signedAt: string;
}

export interface CertificateVerificationLog {
  id: ID;
  institutionId: ID | null;
  certificateId: ID | null;
  transcriptId: ID | null;
  verificationCode: string;
  ipAddress: string | null;
  userAgent: string | null;
  valid: boolean;
  createdAt: string;
}

export interface CertificateShare {
  id: ID;
  institutionId: ID;
  certificateId: ID | null;
  transcriptId: ID | null;
  shareType: 'download' | 'share_link' | 'verification_link';
  token: string;
  expiresAt: string | null;
  createdAt: string;
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
  transcriptNumber: string;
  transcriptType: TranscriptType;
  programId: ID | null;
  semesterId: ID | null;
  courseId: ID | null;
  verificationCode: string;
  verificationURL: string;
  status: TranscriptStatus;
  version: number;
  semesterGpa: number | null;
  cgpa: number | null;
  academicStanding: string | null;
  remarks: string | null;
  courses: TranscriptCourseRow[];
  documentPayload: Record<string, unknown>;
  issuedAt: string | null;
  issuedBy: ID | null;
  revokedAt: string | null;
  revokedBy: ID | null;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicRecord {
  id: ID;
  institutionId: ID;
  studentId: ID;
  programId: ID | null;
  semesterId: ID | null;
  currentVersion: number;
  semesterGpa: number | null;
  cgpa: number | null;
  academicStanding: string | null;
  remarks: string | null;
  courses: TranscriptCourseRow[];
  createdAt: string;
  updatedAt: string;
}

export interface AcademicRecordVersion {
  id: ID;
  institutionId: ID;
  academicRecordId: ID;
  version: number;
  snapshot: Record<string, unknown>;
  frozenAt: string;
  frozenBy: ID | null;
  immutable: boolean;
  createdAt: string;
}

export interface CertificateVerificationResult {
  valid: boolean;
  status: CertificateStatus | TranscriptStatus | null;
  documentType: CertificateDocumentType | 'transcript' | null;
  certificateNumber: string | null;
  institutionName: string | null;
  studentName: string | null;
  title: string | null;
  issuedAt: string | null;
  revokedAt: string | null;
  verificationURL: string | null;
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
  publishedCount: number;
  revokedCount: number;
  pendingEligible: number;
  transcriptCount: number;
  downloadCount: number;
  verificationRequests: number;
  topPrograms: Array<{ programId: string; count: number }>;
  topCourses: Array<{ courseId: string; count: number }>;
}

export interface CertificateRegistryRow {
  certificateNumber: string;
  studentId: string;
  documentType: string;
  status: string;
  issueDate: string | null;
  verificationCode: string;
}
