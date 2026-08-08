/** Enterprise certificate document types — eligibility always from published gradebook */
export const CERTIFICATE_DOCUMENT_TYPES = [
  'course_completion',
  'lab_completion',
  'project_completion',
  'quiz_completion',
  'exam_completion',
  'semester_completion',
  'program_completion',
  'graduation',
  'merit',
  'participation',
  'custom',
  // legacy aliases (still accepted)
  'semester_record',
  'transcript',
  'honors',
  'distinction',
] as const;

export const CERTIFICATE_STATUSES = [
  'draft',
  'generated',
  'issued',
  'published',
  'revoked',
  'archived',
  'expired',
] as const;

export const TRANSCRIPT_TYPES = [
  'semester',
  'complete',
  'course_wise',
  'official',
] as const;

export const TRANSCRIPT_STATUSES = ['draft', 'issued', 'published', 'revoked', 'archived'] as const;

export const CERTIFICATE_SIGNATURE_ROLES = [
  'institution',
  'registrar',
  'dean',
  'faculty',
] as const;

export const CERTIFICATE_SHARE_TYPES = ['download', 'share_link', 'verification_link'] as const;

export const CERTIFICATE_BULK_ACTIONS = [
  'generate',
  'issue',
  'publish',
  'revoke',
  'archive',
  'download',
] as const;

export const CERTIFICATE_REGISTRY_EXPORT_FORMATS = ['csv', 'zip'] as const;

/** Standings allowed for graduation certificates — values come from gradebook `AcademicStanding`, never computed here */
export const CERTIFICATE_GRADUATION_STANDINGS = [
  'good_standing',
  'honors',
  'distinction',
] as const;

export const CERTIFICATE_AUDIT_EVENTS = [
  'template.created',
  'template.updated',
  'certificate.generated',
  'certificate.issued',
  'certificate.published',
  'certificate.revoked',
  'certificate.archived',
  'certificate.bulk_issued',
  'certificate.regenerated',
  'transcript.generated',
  'transcript.issued',
  'transcript.revoked',
  'academic_record.generated',
  'verification.checked',
  'share.created',
] as const;

export const CERTIFICATE_DEFAULTS = {
  NUMBER_PREFIX: 'LNV',
  NUMBER_SEGMENT: 'CERT',
  VERIFICATION_PREFIX: 'LN',
  VERIFICATION_BASE_PATH: '/verify',
  PUBLIC_CERTIFICATE_PATH: '/certificate',
  TITLE_COURSE: 'Certificate of Completion',
  TITLE_LAB: 'Practice Lab Completion Certificate',
  TITLE_PROJECT: 'Project Completion Certificate',
  TITLE_QUIZ: 'Quiz Completion Certificate',
  TITLE_EXAM: 'Exam Completion Certificate',
  TITLE_SEMESTER: 'Semester Completion Certificate',
  TITLE_PROGRAM: 'Program Completion Certificate',
  TITLE_GRADUATION: 'Graduation Certificate',
  TITLE_MERIT: 'Merit Certificate',
  TITLE_PARTICIPATION: 'Certificate of Participation',
  TITLE_TRANSCRIPT: 'Official Academic Transcript',
} as const;

/** Print/PDF styling aligned with Learnova design tokens (`packages/ui` globals) */
export const CERTIFICATE_PDF_THEME = {
  primary: '#2563EB',
  secondary: '#0F172A',
  accent: '#7C3AED',
  border: '#E2E8F0',
  muted: '#64748B',
  background: '#F8FAFC',
  card: '#FFFFFF',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
  gradient: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
} as const;

/** Maps activity-based certificate types to gradebook entry kinds (read-only) */
export const CERTIFICATE_ACTIVITY_KIND_MAP = {
  lab_completion: 'lab',
  project_completion: 'project',
  quiz_completion: 'quiz',
  exam_completion: 'exam',
} as const;
