export const CERTIFICATE_DOCUMENT_TYPES = [
  'course_completion',
  'semester_record',
  'transcript',
  'honors',
  'distinction',
] as const;

export const CERTIFICATE_STATUSES = ['draft', 'issued', 'revoked', 'expired'] as const;

export const TRANSCRIPT_STATUSES = ['draft', 'issued', 'revoked'] as const;

export const CERTIFICATE_AUDIT_EVENTS = [
  'template.created',
  'template.updated',
  'certificate.issued',
  'certificate.revoked',
  'certificate.bulk_issued',
  'transcript.issued',
  'transcript.revoked',
  'verification.checked',
] as const;

export const CERTIFICATE_DEFAULTS = {
  VERIFICATION_PREFIX: 'LN',
  TITLE_COURSE: 'Certificate of Completion',
  TITLE_SEMESTER: 'Semester Academic Record',
  TITLE_TRANSCRIPT: 'Official Academic Transcript',
  TITLE_HONORS: 'Certificate of Honors',
  TITLE_DISTINCTION: 'Certificate of Distinction',
} as const;
