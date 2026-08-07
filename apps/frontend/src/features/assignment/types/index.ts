import type {
  Assignment,
  AssignmentFacultyDashboard,
  AssignmentInstitutionDashboard,
  AssignmentStatus,
  AssignmentStudentDashboard,
  AssignmentSubmission,
  AssignmentSubmissionStatus,
  AssignmentType,
  PaginatedMeta,
} from '@learnova/types';

export type AssignmentListParams = {
  q?: string;
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  status?: AssignmentStatus;
  assignmentType?: AssignmentType;
  published?: boolean;
  due?: 'upcoming' | 'overdue' | 'none';
  late?: boolean;
  graded?: boolean;
  studentId?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type AssignmentListResult = {
  items: Assignment[];
  meta: PaginatedMeta;
};

export type SubmissionListParams = {
  q?: string;
  assignmentId?: string;
  courseId?: string;
  studentId?: string;
  status?: AssignmentSubmissionStatus;
  late?: boolean;
  graded?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type SubmissionListResult = {
  items: AssignmentSubmission[];
  meta: PaginatedMeta;
};

export type AssignmentCreateBody = {
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  assignmentType?: AssignmentType;
  totalMarks?: number;
  passingMarks?: number;
  weightage?: number;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
  allowResubmission?: boolean;
  maxAttempts?: number;
  dueDate?: string | null;
  publishDate?: string | null;
  closeDate?: string | null;
  estimatedMinutes?: number | null;
  rubricId?: string | null;
};

export type AssignmentUpdateBody = Partial<Omit<AssignmentCreateBody, 'courseId'>>;

export type SubmitBody = {
  assignmentId: string;
  submissionType?: 'text' | 'file' | 'link' | 'mixed';
  textSubmission?: string | null;
  links?: string[];
  timeSpentMinutes?: number | null;
  attemptNumber?: number;
};

export type GradeBody = {
  gradingMethod?: 'manual' | 'rubric' | 'pass_fail' | 'marks' | 'percentage';
  marksObtained?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  feedback?: string | null;
  rubricScores?: Array<{ criterionId: string; points: number; comment?: string | null }>;
  returnToStudent?: boolean;
};

export type {
  Assignment,
  AssignmentFacultyDashboard,
  AssignmentInstitutionDashboard,
  AssignmentStatus,
  AssignmentStudentDashboard,
  AssignmentSubmission,
  AssignmentSubmissionStatus,
  AssignmentType,
};
