import type { ID } from '../common/index.js';

export type OrgEntityStatus = 'active' | 'inactive' | 'archived';

export type ProgramLevel =
  | 'certificate'
  | 'diploma'
  | 'undergraduate'
  | 'postgraduate'
  | 'doctoral';

export type SemesterTerm = 'odd' | 'even' | 'summer';

export type CalendarEventType =
  | 'semester_start'
  | 'semester_end'
  | 'exam_start'
  | 'exam_end'
  | 'holiday'
  | 'event';

export interface SoftDeleteFields {
  deletedAt: string | null;
}

/** Read-only tenant branding for layouts and auth session. */
export interface InstitutionBranding {
  name: string;
  shortName: string;
  logo: string | null;
  favicon: string | null;
}

export interface Institution {
  id: ID;
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
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Campus {
  id: ID;
  institutionId: ID;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  status: OrgEntityStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface School {
  id: ID;
  institutionId: ID;
  name: string;
  code: string;
  description: string | null;
  status: OrgEntityStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Department {
  id: ID;
  institutionId: ID;
  schoolId: ID;
  name: string;
  code: string;
  description: string | null;
  status: OrgEntityStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Program {
  id: ID;
  institutionId: ID;
  departmentId: ID;
  name: string;
  code: string;
  durationYears: number;
  credits: number;
  level: ProgramLevel;
  status: OrgEntityStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AcademicYear {
  id: ID;
  institutionId: ID;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: OrgEntityStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Semester {
  id: ID;
  institutionId: ID;
  academicYearId: ID;
  name: string;
  number: number;
  term: SemesterTerm;
  startDate: string | null;
  endDate: string | null;
  status: OrgEntityStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Section {
  id: ID;
  institutionId: ID;
  programId: ID;
  semesterId: ID;
  name: string;
  capacity: number;
  status: OrgEntityStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Batch {
  id: ID;
  institutionId: ID;
  programId: ID;
  name: string;
  year: number;
  status: OrgEntityStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AcademicCalendarEvent {
  id: ID;
  type: CalendarEventType;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
}

export interface AcademicCalendar {
  id: ID;
  institutionId: ID;
  academicYearId: ID;
  name: string;
  events: AcademicCalendarEvent[];
  status: OrgEntityStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface InstitutionSettings {
  id: ID;
  institutionId: ID;
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
  createdAt: string;
  updatedAt: string;
}
