import type {
  Student,
  StudentStatus,
  StudentGender,
  PaginatedMeta,
} from '@learnova/types';

export type {
  Student,
  StudentStatus,
  StudentGender,
  StudentStats,
  StudentImportPreview,
  StudentImportResult,
} from '@learnova/types';

export interface StudentListParams {
  q?: string;
  status?: StudentStatus;
  includeDeleted?: boolean;
  campusId?: string;
  schoolId?: string;
  departmentId?: string;
  programId?: string;
  academicYearId?: string;
  semesterId?: string;
  sectionId?: string;
  batchId?: string;
  gender?: StudentGender;
  scholarship?: boolean;
  hostelResident?: boolean;
  transportRequired?: boolean;
  admissionDateFrom?: string;
  admissionDateTo?: string;
  yearOfStudy?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StudentListResult {
  items: Student[];
  meta: PaginatedMeta;
}

export interface StudentCredentials {
  email: string;
  temporaryPassword: string;
  studentId: string;
  admissionNumber: string;
}

export type StudentCreateResult = Student & {
  credentials: StudentCredentials | null;
};

export interface StudentCreateBody {
  studentId: string;
  admissionNumber: string;
  rollNumber?: string | null;
  registrationNumber?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  middleName?: string | null;
  campusId?: string | null;
  schoolId?: string | null;
  departmentId?: string | null;
  programId?: string | null;
  academicYearId?: string | null;
  semesterId?: string | null;
  sectionId?: string | null;
  batchId?: string | null;
  phone?: string | null;
  alternateEmail?: string | null;
  alternatePhone?: string | null;
  profilePhoto?: string | null;
  gender?: StudentGender | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  nationality?: string | null;
  religion?: string | null;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  guardianName?: string | null;
  guardianRelation?: string | null;
  guardianPhone?: string | null;
  guardianEmail?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  admissionDate?: string | null;
  expectedGraduationDate?: string | null;
  programDuration?: number | null;
  yearOfStudy?: number | null;
  currentSemester?: number | null;
  scholarship?: boolean;
  hostelResident?: boolean;
  transportRequired?: boolean;
  bio?: string | null;
  linkedin?: string | null;
  website?: string | null;
  status?: StudentStatus;
  isActive?: boolean;
}

export type StudentUpdateBody = Partial<StudentCreateBody>;

export interface StudentUpdateProfileBody {
  phone?: string | null;
  alternatePhone?: string | null;
  alternateEmail?: string | null;
  profilePhoto?: string | null;
  bio?: string | null;
  linkedin?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  guardianName?: string | null;
  guardianRelation?: string | null;
  guardianPhone?: string | null;
  guardianEmail?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface StudentBulkIdsBody {
  ids: string[];
}

export interface StudentBulkStatusBody {
  ids: string[];
  status: StudentStatus;
}

export interface StudentBulkAssignSectionBody {
  ids: string[];
  sectionId: string;
  semesterId?: string | null;
}

export interface StudentBulkAssignDepartmentBody {
  ids: string[];
  departmentId: string;
  schoolId?: string | null;
  campusId?: string | null;
}

export interface StudentBulkAssignProgramBody {
  ids: string[];
  programId: string;
}

export interface StudentPhotoUploadBody {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  data: string;
}
