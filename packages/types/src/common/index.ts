/**
 * Shared domain types for Learnova.
 * Consumed by frontend, backend, and worker.
 */

/** Platform roles — current + reserved for future expansion */
export type Role =
  | 'student'
  | 'faculty'
  | 'institution_admin'
  | 'super_admin'
  | 'teaching_assistant'
  | 'placement_officer'
  | 'parent';

/** Active roles in v1 */
export type ActiveRole = Extract<Role, 'student' | 'faculty' | 'institution_admin'>;

/** Future roles reserved in the type system */
export type FutureRole = Exclude<Role, ActiveRole>;

/** Core product modules */
export type ModuleName =
  | 'lms'
  | 'erp'
  | 'examination'
  | 'coding'
  | 'ide'
  | 'ideation'
  | 'analytics'
  | 'audit';

/** Supported locales — architecture supports unlimited languages */
export type Locale = 'en' | 'hi' | 'te';

export type Environment = 'development' | 'staging' | 'production' | 'test';

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface SoftDelete {
  deletedAt: string | null;
}

export type ID = string;
