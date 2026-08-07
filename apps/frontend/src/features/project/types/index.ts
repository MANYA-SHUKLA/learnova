import type {
  PaginatedMeta,
  Project,
  ProjectFacultyDashboard,
  ProjectFileRef,
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

/** Full academic spec project types */
export type ProjectTypeSpec =
  | 'mini_project'
  | 'major_project'
  | 'capstone'
  | 'research'
  | 'case_study'
  | 'industry_project'
  | 'innovation_challenge'
  | 'open_project'
  | ProjectType;

export type ProjectDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type ProjectTeamStatusSpec =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | ProjectTeamStatus;

export type ProjectMilestoneType =
  | 'proposal'
  | 'design'
  | 'implementation'
  | 'testing'
  | 'documentation'
  | 'presentation'
  | 'final_submission'
  | 'custom';

export type ProjectInvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export type ProjectSortOption =
  | 'newest'
  | 'oldest'
  | 'deadline'
  | 'title'
  | 'difficulty';

export interface ProjectCategory {
  id: string;
  institutionId?: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface ProjectTag {
  id: string;
  institutionId?: string;
  name: string;
  slug: string;
}

export interface ProjectComment {
  id: string;
  institutionId?: string;
  projectId: string;
  submissionId?: string | null;
  milestoneId?: string | null;
  parentCommentId?: string | null;
  authorId: string;
  body: string;
  resolved: boolean;
  attachments: ProjectFileRef[];
  createdAt: string;
  updatedAt: string;
  replies?: ProjectComment[];
}

export interface ProjectTeamInvitation {
  id: string;
  teamId: string;
  projectId: string;
  studentId: string;
  status: ProjectInvitationStatus;
  invitedBy: string;
  createdAt: string;
}

export interface ProjectTeamMember {
  id: string;
  teamId: string;
  projectId: string;
  studentId: string;
  role: ProjectTeamMemberRole;
  approvedBy?: string | null;
  joinedAt: string;
}

export interface MyTeamEntry {
  teamId: string;
  teamName: string;
  projectId: string;
  projectTitle: string;
  status: ProjectTeamStatusSpec;
  memberCount: number;
  members: ProjectTeamMember[];
  pendingInvitations: ProjectTeamInvitation[];
}

export type ProjectExtended = Project & {
  slug?: string | null;
  objective?: string | null;
  problemStatement?: string | null;
  learningOutcomes?: string[];
  difficulty?: ProjectDifficulty | null;
  categoryId?: string | null;
  category?: ProjectCategory | null;
  tagIds?: string[];
  tags?: ProjectTag[];
  startDate?: string | null;
  submissionDeadline?: string | null;
  resources?: ProjectFileRef[];
  allowIndividual?: boolean;
  allowTeams?: boolean;
  facultyId?: string | null;
  archived?: boolean;
};

export type ProjectInstitutionDashboardExtended = ProjectInstitutionDashboard & {
  active?: number;
  completed?: number;
  departments?: number;
  facultyParticipation?: number;
};

export type ProjectFacultyDashboardExtended = ProjectFacultyDashboard & {
  upcomingDeadlines?: number;
  studentTeams?: number;
  lateSubmissions?: number;
};

export type ProjectStudentDashboardExtended = ProjectStudentDashboard & {
  myProjects?: number;
  currentTeam?: string | null;
  milestones?: number;
  upcomingDeadlines?: number;
  submissionHistory?: number;
  reviewFeedback?: number;
};

export type ProjectListParams = {
  q?: string;
  courseId?: string;
  facultyId?: string;
  moduleId?: string;
  lessonId?: string;
  status?: ProjectStatus;
  projectType?: ProjectTypeSpec;
  difficulty?: ProjectDifficulty;
  categoryId?: string;
  tagId?: string;
  published?: boolean;
  archived?: boolean;
  due?: 'upcoming' | 'overdue' | 'none';
  late?: boolean;
  graded?: boolean;
  studentId?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  sort?: ProjectSortOption;
};

export type ProjectListResult = {
  items: ProjectExtended[];
  meta: PaginatedMeta;
};

export type MilestoneListResult = {
  items: ProjectMilestone[];
  total: number;
};

export type TeamListParams = {
  projectId?: string;
  courseId?: string;
  status?: ProjectTeamStatusSpec;
  pendingApproval?: boolean;
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

export type CommentListParams = {
  projectId: string;
  submissionId?: string;
  milestoneId?: string;
  resolved?: boolean;
  page?: number;
  limit?: number;
};

export type CommentListResult = {
  items: ProjectComment[];
  meta: PaginatedMeta;
};

export type MyTeamListResult = {
  items: MyTeamEntry[];
  meta: PaginatedMeta;
};

export type BulkIdsBody = { ids: string[] };

export type BulkAssignFacultyBody = { ids: string[]; facultyId: string };

export type BulkResult = { modified: number; ids?: string[] };

export type ProjectCreateBody = {
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  slug?: string | null;
  title: string;
  description?: string | null;
  objective?: string | null;
  problemStatement?: string | null;
  learningOutcomes?: string[];
  instructions?: string | null;
  projectType?: ProjectTypeSpec;
  difficulty?: ProjectDifficulty | null;
  categoryId?: string | null;
  tagIds?: string[];
  teamSizeMin?: number;
  teamSizeMax?: number;
  allowIndividual?: boolean;
  allowTeams?: boolean;
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
  startDate?: string | null;
  dueDate?: string | null;
  submissionDeadline?: string | null;
  closeDate?: string | null;
  estimatedMinutes?: number | null;
  rubricId?: string | null;
  facultyId?: string | null;
  resources?: string[];
};

export type ProjectUpdateBody = Partial<Omit<ProjectCreateBody, 'courseId'>>;

export type MilestoneCreateBody = {
  projectId: string;
  title: string;
  description?: string | null;
  milestoneType?: ProjectMilestoneType;
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
  status?: ProjectTeamStatusSpec;
};

export type JoinTeamBody = {
  teamId: string;
  role?: ProjectTeamMemberRole;
};

export type TeamInviteBody = {
  studentId: string;
};

export type TeamTransferLeadershipBody = {
  studentId: string;
};

export type TeamRejectBody = {
  reason?: string | null;
};

export type SubmitBody = {
  projectId: string;
  milestoneId?: string | null;
  deliveryType?: 'text' | 'file' | 'link' | 'mixed';
  textSubmission?: string | null;
  links?: string[];
  repoLink?: string | null;
  githubRepository?: string | null;
  demoVideo?: string | null;
  liveDemoURL?: string | null;
  timeSpentMinutes?: number | null;
  attemptNumber?: number;
};

export type GradeBody = {
  gradingMethod?: 'manual' | 'rubric' | 'pass_fail' | 'marks' | 'percentage';
  marksObtained?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  score?: number | null;
  feedback?: string | null;
  suggestions?: string | null;
  approval?: boolean | null;
  revisionRequired?: boolean | null;
  rubricScores?: Array<{ criterionId: string; points: number; comment?: string | null }>;
  returnToStudent?: boolean;
};

export type ReviewCreateBody = {
  projectId: string;
  submissionId: string;
  reviewType?: 'peer' | 'faculty';
  rating?: number | null;
  score?: number | null;
  feedback?: string | null;
  suggestions?: string | null;
  approval?: boolean | null;
  revisionRequired?: boolean | null;
  rubricScores?: Array<{ criterionId: string; points: number; comment?: string | null }>;
};

export type ReviewSubmitBody = {
  rating?: number | null;
  score?: number | null;
  feedback?: string | null;
  suggestions?: string | null;
  approval?: boolean | null;
  revisionRequired?: boolean | null;
  rubricScores?: Array<{ criterionId: string; points: number; comment?: string | null }>;
};

export type CommentCreateBody = {
  projectId: string;
  body: string;
  submissionId?: string | null;
  milestoneId?: string | null;
  parentCommentId?: string | null;
};

export type CommentUpdateBody = {
  body?: string;
  resolved?: boolean;
};

export type {
  Project,
  ProjectExtended as ProjectDetail,
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
  ProjectTypeSpec as ProjectAcademicType,
};
