import type { ID } from '../common/index.js';

export type FacultyStatus =
  | 'active'
  | 'on_leave'
  | 'suspended'
  | 'retired'
  | 'archived';

export type FacultyEmploymentType =
  | 'full_time'
  | 'part_time'
  | 'adjunct'
  | 'guest_faculty'
  | 'visiting_professor'
  | 'research_fellow'
  | 'teaching_assistant';

export type FacultyDesignation =
  | 'assistant_professor'
  | 'associate_professor'
  | 'professor'
  | 'head_of_department'
  | 'dean'
  | 'lecturer'
  | 'research_scientist'
  | 'custom';

export type FacultyGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Faculty {
  id: ID;
  employeeId: string;
  facultyCode: string;
  institutionId: ID;
  campusId: ID | null;
  schoolId: ID | null;
  departmentId: ID | null;
  programIds: ID[];
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  email: string;
  alternateEmail: string | null;
  phone: string | null;
  alternatePhone: string | null;
  profilePhoto: string | null;
  gender: FacultyGender | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  designation: FacultyDesignation;
  customDesignation: string | null;
  employmentType: FacultyEmploymentType;
  joiningDate: string | null;
  experienceYears: number;
  highestQualification: string | null;
  specialization: string | null;
  researchAreas: string[];
  bio: string | null;
  officeRoom: string | null;
  officeHours: string | null;
  linkedin: string | null;
  website: string | null;
  orcid: string | null;
  googleScholar: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  isActive: boolean;
  status: FacultyStatus;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface FacultyStats {
  total: number;
  active: number;
  inactive: number;
  onLeave: number;
  suspended: number;
  retired: number;
  archived: number;
  departments: number;
  newThisMonth: number;
  byDepartment: Array<{ departmentId: string | null; label: string; count: number }>;
  byEmploymentType: Array<{ employmentType: string; count: number }>;
  byExperience: Array<{ bucket: string; count: number }>;
}

export interface FacultyImportRowError {
  row: number;
  field?: string;
  message: string;
}

export interface FacultyImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicates: number;
  errors: FacultyImportRowError[];
  sample: Array<Record<string, string>>;
}

export interface FacultyImportResult {
  imported: number;
  failed: number;
  errors: FacultyImportRowError[];
  facultyIds: string[];
}
