/**
 * Institution feature types — aligned with API DTOs (`id` as string).
 */

import type {
  AcademicCalendar,
  AcademicCalendarEvent,
  AcademicYear,
  Batch,
  Campus,
  Department,
  Institution,
  InstitutionSettings,
  OrgEntityStatus,
  PaginatedMeta,
  Program,
  ProgramLevel,
  School,
  Section,
  Semester,
  SemesterTerm,
  CalendarEventType,
} from '@learnova/types';

export type {
  AcademicCalendar,
  AcademicCalendarEvent,
  AcademicYear,
  Batch,
  Campus,
  Department,
  Institution,
  InstitutionSettings,
  OrgEntityStatus,
  Program,
  ProgramLevel,
  School,
  Section,
  Semester,
  SemesterTerm,
  CalendarEventType,
};

export interface OrgListParams {
  q?: string;
  status?: OrgEntityStatus;
  includeDeleted?: boolean;
  schoolId?: string;
  departmentId?: string;
  programId?: string;
  academicYearId?: string;
  semesterId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrgListResult<T> {
  items: T[];
  meta: PaginatedMeta;
}

export interface InstitutionBrandingInput {
  logo?: string | null;
  favicon?: string | null;
}

export type InstitutionUpdateInput = Partial<{
  name: string;
  shortName: string;
  slug: string;
  code: string;
  email: string;
  phone: string | null;
  website: string | null;
  logo: string | null;
  favicon: string | null;
  timezone: string;
  currency: string;
  country: string;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  address: string | null;
  status: OrgEntityStatus;
  subscriptionPlan: string;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  maxStudents: number;
  maxFaculty: number;
  maxStorage: number;
}>;

export interface CampusInput {
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: OrgEntityStatus;
}

export interface SchoolInput {
  name: string;
  code: string;
  description?: string | null;
  status?: OrgEntityStatus;
}

export interface DepartmentInput {
  schoolId: string;
  name: string;
  code: string;
  description?: string | null;
  status?: OrgEntityStatus;
}

export interface ProgramInput {
  departmentId: string;
  name: string;
  code: string;
  durationYears: number;
  credits: number;
  level: ProgramLevel;
  status?: OrgEntityStatus;
}

export interface AcademicYearInput {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  status?: OrgEntityStatus;
}

export interface SemesterInput {
  academicYearId: string;
  name: string;
  number: number;
  term: SemesterTerm;
  startDate?: string | null;
  endDate?: string | null;
  status?: OrgEntityStatus;
}

export interface SectionInput {
  programId: string;
  semesterId: string;
  name: string;
  capacity?: number;
  status?: OrgEntityStatus;
}

export interface BatchInput {
  programId: string;
  name: string;
  year: number;
  status?: OrgEntityStatus;
}

export interface AcademicCalendarInput {
  academicYearId: string;
  name: string;
  events?: {
    id?: string;
    type: CalendarEventType;
    title: string;
    description?: string | null;
    startDate: string;
    endDate: string;
  }[];
  status?: OrgEntityStatus;
}

export type InstitutionSettingsInput = Partial<{
  language: string;
  theme: string;
  attendance: Record<string, unknown>;
  gradingScale: Record<string, unknown>;
  examRules: Record<string, unknown>;
  certificateSettings: Record<string, unknown>;
  storageSettings: Record<string, unknown>;
  aiSettings: Record<string, unknown>;
  notificationSettings: Record<string, unknown>;
  securitySettings: Record<string, unknown>;
}>;

export type OrgResourceKey =
  | 'campuses'
  | 'schools'
  | 'departments'
  | 'programs'
  | 'academic-years'
  | 'semesters'
  | 'sections'
  | 'batches'
  | 'academic-calendars';
