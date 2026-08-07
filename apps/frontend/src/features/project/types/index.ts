import type {
  PaginatedMeta,
  Project,
  ProjectFacultyDashboard,
  ProjectGrade,
  ProjectInstitutionDashboard,
  ProjectMilestone,
  ProjectMilestoneStatus,
  ProjectReview,
  ProjectStatus,
  ProjectStudentDashboard,
  ProjectSubmission,
  ProjectSubmissionStatus,
  ProjectTeam,
  ProjectTeamMemberRole,
  ProjectTeamStatus,
  ProjectType,
  ProjectVisibility,
} from '@learnova/types';

export type ProjectListParams = {
  q?: string;
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  status?: ProjectStatus;
  projectType?: ProjectType;
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

export type ProjectListResult = {
  items: Project[];
  meta: PaginatedMeta;
};

export type MilestoneListResult = {
  items: ProjectMilestone[];
  total: number;
};

export type TeamListParams = {
  projectId?: string;
  courseId?: string;
  status?: ProjectTeamStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type TeamListResult = {
  items: ProjectTeam[];
  meta: PaginatedMeta;
};

export type SubmissionListParams = {
  q?: string;
  projectId?: string;
  courseId?: string;
  studentId?: string;
  teamId?: string;
  milestoneId?: string;
  status?: ProjectSubmissionStatus;
  late?: boolean;
  graded?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type SubmissionListResult = {
  items: ProjectSubmission[];
  meta: PaginatedMeta;
};

export type ProjectCreateBody = {
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  projectType?: ProjectType;
  teamSizeMin?: number;
  teamSizeMax?: number;
  allowSelfTeamFormation?: boolean;
  allowPeerReview?: boolean;
  peerReviewsRequired?: number;
  allowRepoLink?: boolean;
  allowMilestones?: boolean;
  visibility?: ProjectVisibility;
  totalMarks?: number;
  passingMarks?: number;
  weightage?: number;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
  allowResubmission?: boolean;
  maxAttempts?: number;
  publishDate?: string | null;
  dueDate?: string | null;
  closeDate?: string | null;
  estimatedMinutes?: number | null;
  rubricId?: string | null;
};

export type ProjectUpdateBody = Partial<Omit<ProjectCreateBody, 'courseId'>>;

export type MilestoneCreateBody = {
  projectId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  order?: number;
  weight?: number;
};

export type MilestoneUpdateBody = Partial<Omit<MilestoneCreateBody, 'projectId'>>;

export type TeamCreateBody = {
  projectId: string;
  name: string;
  repoLink?: string | null;
};

export type TeamUpdateBody = {
  name?: string;
  repoLink?: string | null;
  status?: ProjectTeamStatus;
};

export type JoinTeamBody = {
  teamId: string;
  role?: ProjectTeamMemberRole;
};

export type SubmitBody = {
  projectId: string;
  milestoneId?: string | null;
  deliveryType?: 'text' | 'file' | 'link' | 'mixed';
  textSubmission?: string | null;
  links?: string[];
  repoLink?: string | null;
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

export type ReviewCreateBody = {
  projectId: string;
  submissionId: string;
  reviewType?: 'peer' | 'faculty';
  rating?: number | null;
  feedback?: string | null;
  rubricScores?: Array<{ criterionId: string; points: number; comment?: string | null }>;
};

export type ReviewSubmitBody = {
  rating?: number | null;
  feedback?: string | null;
  rubricScores?: Array<{ criterionId: string; points: number; comment?: string | null }>;
};

export type {
  Project,
  ProjectFacultyDashboard,
  ProjectInstitutionDashboard,
  ProjectMilestone,
  ProjectMilestoneStatus,
  ProjectReview,
  ProjectStatus,
  ProjectStudentDashboard,
  ProjectSubmission,
  ProjectSubmissionStatus,
  ProjectTeam,
  ProjectTeamStatus,
  ProjectType,
};
