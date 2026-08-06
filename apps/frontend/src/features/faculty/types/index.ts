import type {
  Faculty,
  FacultyDesignation,
  FacultyEmploymentType,
  FacultyStatus,
  PaginatedMeta,
} from '@learnova/types';

export type {
  Faculty,
  FacultyDesignation,
  FacultyEmploymentType,
  FacultyStatus,
  FacultyStats,
  FacultyImportPreview,
  FacultyImportResult,
} from '@learnova/types';

export interface FacultyListParams {
  q?: string;
  status?: FacultyStatus;
  includeDeleted?: boolean;
  campusId?: string;
  schoolId?: string;
  departmentId?: string;
  programId?: string;
  designation?: FacultyDesignation;
  employmentType?: FacultyEmploymentType;
  joiningDateFrom?: string;
  joiningDateTo?: string;
  experienceMin?: number;
  experienceMax?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FacultyListResult {
  items: Faculty[];
  meta: PaginatedMeta;
}

export type FacultyCreateBody = {
  employeeId: string;
  facultyCode: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: FacultyDesignation;
  employmentType: FacultyEmploymentType;
  middleName?: string | null;
  campusId?: string | null;
  schoolId?: string | null;
  departmentId?: string | null;
  programIds?: string[];
  courseIds?: string[];
  academicYearId?: string | null;
  semesterId?: string | null;
  phone?: string | null;
  alternateEmail?: string | null;
  alternatePhone?: string | null;
  profilePhoto?: string | null;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  dateOfBirth?: string | null;
  customDesignation?: string | null;
  joiningDate?: string | null;
  experienceYears?: number;
  highestQualification?: string | null;
  specialization?: string | null;
  researchAreas?: string[];
  bio?: string | null;
  officeRoom?: string | null;
  officeHours?: string | null;
  linkedin?: string | null;
  website?: string | null;
  orcid?: string | null;
  googleScholar?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  status?: FacultyStatus;
  isActive?: boolean;
};

export type FacultyUpdateBody = Partial<FacultyCreateBody>;

export type FacultyUpdateProfileBody = {
  phone?: string | null;
  alternatePhone?: string | null;
  alternateEmail?: string | null;
  profilePhoto?: string | null;
  bio?: string | null;
  officeRoom?: string | null;
  officeHours?: string | null;
  linkedin?: string | null;
  website?: string | null;
  orcid?: string | null;
  googleScholar?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
};

export interface FacultyBulkIdsBody {
  ids: string[];
}

export interface FacultyBulkStatusBody {
  ids: string[];
  status: FacultyStatus;
}

export interface FacultyBulkAssignDepartmentBody {
  ids: string[];
  departmentId: string;
  schoolId?: string | null;
  campusId?: string | null;
}

export interface FacultyBulkAssignProgramBody {
  ids: string[];
  programIds: string[];
  mode?: 'replace' | 'append';
}

export interface FacultyPhotoUploadBody {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  data: string;
}
