import type { ID } from '../common/index.js';

export type ProjectType = 'individual' | 'team' | 'hybrid';

export type ProjectStatus = 'draft' | 'published' | 'archived' | 'closed';

export type ProjectVisibility = 'institution' | 'enrolled' | 'faculty';

export type ProjectSubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'late'
  | 'returned'
  | 'graded'
  | 'missing';

export type ProjectDeliveryType = 'text' | 'file' | 'link' | 'mixed';

export type ProjectGradingMethod =
  | 'manual'
  | 'rubric'
  | 'pass_fail'
  | 'marks'
  | 'percentage';

export type ProjectTeamStatus = 'forming' | 'active' | 'dissolved';

export type ProjectTeamMemberRole = 'leader' | 'member';

export type ProjectMilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export type ProjectReviewType = 'peer' | 'faculty';

export type ProjectReviewStatus = 'draft' | 'submitted';

export type ProjectProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'graded';

export interface ProjectFileRef {
  id: ID;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  url: string | null;
  uploadedBy: ID | null;
  createdAt: string;
}

export interface Project {
  id: ID;
  institutionId: ID;
  courseId: ID;
  moduleId: ID | null;
  lessonId: ID | null;
  title: string;
  description: string | null;
  instructions: string | null;
  projectType: ProjectType;
  teamSizeMin: number;
  teamSizeMax: number;
  allowSelfTeamFormation: boolean;
  allowPeerReview: boolean;
  peerReviewsRequired: number;
  allowRepoLink: boolean;
  allowMilestones: boolean;
  visibility: ProjectVisibility;
  status: ProjectStatus;
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
  attachments: ProjectFileRef[];
  rubricId: ID | null;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectMilestone {
  id: ID;
  institutionId: ID;
  projectId: ID;
  title: string;
  description: string | null;
  dueDate: string | null;
  order: number;
  weight: number;
  status: ProjectMilestoneStatus;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectTeam {
  id: ID;
  institutionId: ID;
  projectId: ID;
  courseId: ID;
  name: string;
  status: ProjectTeamStatus;
  leaderId: ID | null;
  memberCount: number;
  repoLink: string | null;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectTeamMember {
  id: ID;
  institutionId: ID;
  teamId: ID;
  projectId: ID;
  studentId: ID;
  role: ProjectTeamMemberRole;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectSubmission {
  id: ID;
  institutionId: ID;
  projectId: ID;
  courseId: ID;
  studentId: ID;
  teamId: ID | null;
  milestoneId: ID | null;
  attemptNumber: number;
  submittedAt: string | null;
  status: ProjectSubmissionStatus;
  deliveryType: ProjectDeliveryType;
  files: ProjectFileRef[];
  textSubmission: string | null;
  links: string[];
  repoLink: string | null;
  timeSpentMinutes: number | null;
  lateSubmission: boolean;
  gradeId: ID | null;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectRubricScore {
  criterionId: ID;
  points: number;
  comment: string | null;
}

export interface ProjectReview {
  id: ID;
  institutionId: ID;
  projectId: ID;
  submissionId: ID;
  reviewerId: ID;
  reviewType: ProjectReviewType;
  status: ProjectReviewStatus;
  rating: number | null;
  feedback: string | null;
  rubricScores: ProjectRubricScore[];
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectGrade {
  id: ID;
  institutionId: ID;
  projectId: ID;
  submissionId: ID;
  studentId: ID;
  teamId: ID | null;
  gradingMethod: ProjectGradingMethod;
  marksObtained: number | null;
  percentage: number | null;
  passed: boolean | null;
  feedback: string | null;
  rubricScores: ProjectRubricScore[];
  gradedBy: ID | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectProgress {
  id: ID;
  institutionId: ID;
  projectId: ID;
  courseId: ID;
  studentId: ID;
  teamId: ID | null;
  status: ProjectProgressStatus;
  milestonesCompleted: number;
  totalMilestones: number;
  peerReviewsGiven: number;
  peerReviewsRequired: number;
  submissionId: ID | null;
  gradeId: ID | null;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAuditLog {
  id: ID;
  institutionId: ID;
  projectId: ID | null;
  submissionId: ID | null;
  teamId: ID | null;
  milestoneId: ID | null;
  studentId: ID | null;
  courseId: ID | null;
  userId: ID | null;
  email: string | null;
  event: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProjectFacultyDashboard {
  projectsCreated: number;
  activeTeams: number;
  pendingReviews: number;
  pendingGrades: number;
  milestoneCompletionRate: number;
  submissionRate: number;
}

export interface ProjectStudentDashboard {
  active: number;
  inProgress: number;
  submitted: number;
  graded: number;
  overdueMilestones: number;
  pendingPeerReviews: number;
}

export interface ProjectInstitutionDashboard {
  totalProjects: number;
  published: number;
  closed: number;
  totalTeams: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  lateSubmissions: number;
  submissionRate: number;
  averageGrade: number | null;
  byDepartment: Array<{ departmentId: string | null; label: string; count: number }>;
  byCourse: Array<{ courseId: string; courseCode: string; title: string; count: number }>;
}

export interface ProjectImportRowError {
  row: number;
  field?: string;
  message: string;
}

export interface ProjectImportResult {
  imported: number;
  failed: number;
  errors: ProjectImportRowError[];
  projectIds: string[];
}
