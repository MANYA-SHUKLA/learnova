import type { ID } from '../common/index.js';

export type AssignmentType =
  | 'homework'
  | 'essay'
  | 'research'
  | 'presentation'
  | 'case_study'
  | 'document_upload'
  | 'pdf_upload'
  | 'image_upload'
  | 'video_upload'
  | 'mixed';

export type AssignmentStatus = 'draft' | 'published' | 'archived' | 'closed';

export type AssignmentVisibility = 'institution' | 'enrolled' | 'faculty';

export type AssignmentSubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'late'
  | 'returned'
  | 'graded'
  | 'missing';

export type AssignmentSubmissionType =
  | 'text'
  | 'file'
  | 'link'
  | 'mixed';

export type AssignmentGradingMethod =
  | 'manual'
  | 'rubric'
  | 'pass_fail'
  | 'marks'
  | 'percentage';

export interface AssignmentFileRef {
  id: ID;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  url: string | null;
  uploadedBy: ID | null;
  createdAt: string;
}

export interface Assignment {
  id: ID;
  institutionId: ID;
  courseId: ID;
  moduleId: ID | null;
  lessonId: ID | null;
  title: string;
  description: string | null;
  instructions: string | null;
  assignmentType: AssignmentType;
  visibility: AssignmentVisibility;
  status: AssignmentStatus;
  totalMarks: number;
  passingMarks: number;
  weightage: number;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  allowResubmission: boolean;
  maxAttempts: number;
  publishDate: string | null;
  dueDate: string | null;
  closeDate: string | null;
  estimatedMinutes: number | null;
  attachments: AssignmentFileRef[];
  rubricId: ID | null;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AssignmentAttachment {
  id: ID;
  institutionId: ID;
  assignmentId: ID;
  submissionId: ID | null;
  commentId: ID | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  url: string | null;
  uploadedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AssignmentRubricCriterion {
  id: ID;
  title: string;
  description: string | null;
  weight: number;
  maxPoints: number;
}

export interface AssignmentRubric {
  id: ID;
  institutionId: ID;
  title: string;
  description: string | null;
  criteria: AssignmentRubricCriterion[];
  totalPoints: number;
  reusable: boolean;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AssignmentSubmission {
  id: ID;
  institutionId: ID;
  assignmentId: ID;
  courseId: ID;
  studentId: ID;
  attemptNumber: number;
  submittedAt: string | null;
  status: AssignmentSubmissionStatus;
  submissionType: AssignmentSubmissionType;
  files: AssignmentFileRef[];
  textSubmission: string | null;
  links: string[];
  timeSpentMinutes: number | null;
  lateSubmission: boolean;
  plagiarismScore: number | null;
  gradeId: ID | null;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AssignmentRubricScore {
  criterionId: ID;
  points: number;
  comment: string | null;
}

export interface AssignmentGrade {
  id: ID;
  institutionId: ID;
  assignmentId: ID;
  submissionId: ID;
  studentId: ID;
  gradingMethod: AssignmentGradingMethod;
  marksObtained: number | null;
  percentage: number | null;
  passed: boolean | null;
  feedback: string | null;
  rubricScores: AssignmentRubricScore[];
  gradedBy: ID | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AssignmentComment {
  id: ID;
  institutionId: ID;
  assignmentId: ID;
  submissionId: ID | null;
  parentCommentId: ID | null;
  authorId: ID;
  authorRole: string;
  body: string;
  attachments: AssignmentFileRef[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AssignmentFacultyDashboard {
  assignmentsCreated: number;
  pendingReviews: number;
  lateSubmissions: number;
  averageGrade: number | null;
  submissionRate: number;
}

export interface AssignmentStudentDashboard {
  upcoming: number;
  submitted: number;
  pending: number;
  late: number;
  gradesReceived: number;
}

export interface AssignmentInstitutionDashboard {
  totalAssignments: number;
  published: number;
  closed: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  lateSubmissions: number;
  submissionRate: number;
  averageGrade: number | null;
  byDepartment: Array<{ departmentId: string | null; label: string; count: number }>;
  byCourse: Array<{ courseId: string; courseCode: string; title: string; count: number }>;
}

export interface AssignmentImportRowError {
  row: number;
  field?: string;
  message: string;
}

export interface AssignmentImportResult {
  imported: number;
  failed: number;
  errors: AssignmentImportRowError[];
  assignmentIds: string[];
}
