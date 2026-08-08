import type {
  Enrollment,
  EnrollmentStatus,
  EnrollmentMethod,
  EnrollmentCompletionStatus,
  EnrollmentApprovalStatus,
  PaginatedMeta,
} from '@learnova/types';

export type {
  Enrollment,
  EnrollmentStatus,
  EnrollmentMethod,
  EnrollmentCompletionStatus,
  EnrollmentApprovalStatus,
  EnrollmentStats,
  EnrollmentImportPreview,
  EnrollmentImportResult,
  EnrollmentWaitlistEntry,
  WaitlistStatus,
} from '@learnova/types';

export interface EnrollmentListParams {
  q?: string;
  status?: EnrollmentStatus;
  approvalStatus?: EnrollmentApprovalStatus;
  completionStatus?: EnrollmentCompletionStatus;
  enrollmentMethod?: EnrollmentMethod;
  includeDeleted?: boolean;
  studentId?: string;
  courseId?: string;
  facultyId?: string;
  departmentId?: string;
  programId?: string;
  academicYearId?: string;
  semesterId?: string;
  sectionId?: string;
  enrollmentDateFrom?: string;
  enrollmentDateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EnrollmentListResult {
  items: Enrollment[];
  meta: PaginatedMeta;
}

export interface EnrollmentCreateBody {
  studentId: string;
  courseId: string;
  departmentId?: string | null;
  programId?: string | null;
  academicYearId?: string | null;
  semesterId?: string | null;
  sectionId?: string | null;
  facultyId?: string | null;
  enrollmentMethod?: EnrollmentMethod;
  notes?: string | null;
}

export type EnrollmentUpdateBody = Partial<
  Pick<
    EnrollmentCreateBody,
    | 'departmentId'
    | 'programId'
    | 'academicYearId'
    | 'semesterId'
    | 'sectionId'
    | 'facultyId'
    | 'notes'
  >
>;

export interface EnrollmentBulkIdsBody {
  ids: string[];
}

export interface EnrollmentBulkApproveBody {
  ids: string[];
}

export interface EnrollmentBulkRejectBody {
  ids: string[];
  reason?: string;
}

export interface EnrollmentSelfEnrollBody {
  courseId: string;
}
