export interface CertificateRow {
  id: string;
  title?: string;
  documentType?: string;
  certificateNumber?: string;
  verificationCode?: string;
  verificationURL?: string;
  status?: string;
}

export interface CertificateTemplateRow {
  id: string;
  name: string;
  documentType?: string;
  titleTemplate?: string;
  active?: boolean;
}

export interface EligibleStudentRow {
  studentId: string;
  fullName?: string;
  rollNumber?: string;
}

export interface CertificateAuditRow {
  id: string;
  event?: string;
  createdAt?: string;
  certificateId?: string;
}
