import type { ID } from '../common/index.js';

export type EnrollmentMethod =
  | 'manual'
  | 'bulk_import'
  | 'self_enrollment'
  | 'invite'
  | 'api';

export type EnrollmentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'completed'
  | 'withdrawn'
  | 'dropped'
  | 'expired';

export type EnrollmentCompletionStatus = 'not_started' | 'in_progress' | 'completed';

export type EnrollmentApprovalStatus = 'pending' | 'approved' | 'rejected' | 'not_required';

export type WaitlistStatus = 'waiting' | 'promoted' | 'left' | 'expired';

export interface Enrollment {
  id: ID;
  studentId: ID;
  courseId: ID;
  institutionId: ID;
  departmentId: ID | null;
  programId: ID | null;
  academicYearId: ID | null;
  semesterId: ID | null;
  sectionId: ID | null;
  facultyId: ID | null;
  enrollmentNumber: string;
  enrollmentDate: string;
  enrollmentMethod: EnrollmentMethod;
  status: EnrollmentStatus;
  approvalStatus: EnrollmentApprovalStatus;
  completionStatus: EnrollmentCompletionStatus;
  completionDate: string | null;
  withdrawReason: string | null;
  droppedBy: ID | null;
  approvedBy: ID | null;
  notes: string | null;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface EnrollmentWaitlistEntry {
  id: ID;
  studentId: ID;
  courseId: ID;
  institutionId: ID;
  position: number;
  status: WaitlistStatus;
  requestedAt: string;
  promotedAt: string | null;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface EnrollmentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  active: number;
  completed: number;
  withdrawn: number;
  dropped: number;
  expired: number;
  waitlisted: number;
  byDepartment: Array<{ departmentId: string | null; label: string; count: number }>;
  byCourse: Array<{ courseId: string; courseCode: string; title: string; count: number }>;
  byStatus: Array<{ status: EnrollmentStatus; count: number }>;
  trend: Array<{ date: string; count: number }>;
  recent: Array<{
    id: string;
    enrollmentNumber: string;
    studentId: string;
    courseId: string;
    status: EnrollmentStatus;
    enrollmentDate: string;
  }>;
}

export interface EnrollmentImportRowError {
  row: number;
  field?: string;
  message: string;
}

export interface EnrollmentImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicates: number;
  errors: EnrollmentImportRowError[];
  sample: Array<Record<string, string>>;
}

export interface EnrollmentImportResult {
  imported: number;
  failed: number;
  errors: EnrollmentImportRowError[];
  enrollmentIds: string[];
}
