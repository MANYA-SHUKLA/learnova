import type { ID } from '../common/index.js';

export type StudentStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'graduated'
  | 'dropped'
  | 'transferred'
  | 'archived';

export type StudentGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Student {
  id: ID;
  studentId: string;
  admissionNumber: string;
  rollNumber: string | null;
  registrationNumber: string | null;
  institutionId: ID;
  campusId: ID | null;
  schoolId: ID | null;
  departmentId: ID | null;
  programId: ID | null;
  academicYearId: ID | null;
  semesterId: ID | null;
  sectionId: ID | null;
  batchId: ID | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  email: string;
  alternateEmail: string | null;
  phone: string | null;
  alternatePhone: string | null;
  profilePhoto: string | null;
  gender: StudentGender | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  nationality: string | null;
  religion: string | null;
  category: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  admissionDate: string | null;
  expectedGraduationDate: string | null;
  programDuration: number | null;
  yearOfStudy: number | null;
  currentSemester: number | null;
  scholarship: boolean;
  hostelResident: boolean;
  transportRequired: boolean;
  bio: string | null;
  linkedin: string | null;
  website: string | null;
  isActive: boolean;
  status: StudentStatus;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  graduated: number;
  dropped: number;
  transferred: number;
  archived: number;
  departments: number;
  programs: number;
  batches: number;
  sections: number;
  newThisMonth: number;
  scholarshipCount: number;
  byDepartment: Array<{ departmentId: string | null; label: string; count: number }>;
  byProgram: Array<{ programId: string | null; label: string; count: number }>;
  byBatch: Array<{ batchId: string | null; label: string; count: number }>;
  bySection: Array<{ sectionId: string | null; label: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  recentAdmissions: Array<{
    id: string;
    fullName: string;
    studentId: string;
    admissionDate: string | null;
    programId: string | null;
  }>;
}

export interface StudentImportRowError {
  row: number;
  field?: string;
  message: string;
}

export interface StudentImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicates: number;
  errors: StudentImportRowError[];
  sample: Array<Record<string, string>>;
}

export interface StudentImportResult {
  imported: number;
  failed: number;
  errors: StudentImportRowError[];
  studentIds: string[];
}
