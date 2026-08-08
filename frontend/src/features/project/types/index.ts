import type {
  PaginatedMeta,
  Project,
  ProjectCategory,
  ProjectComment,
  ProjectDifficulty,
  ProjectFacultyDashboard,
  ProjectInstitutionDashboard,
  ProjectMember,
  ProjectMilestone,
  ProjectMilestoneStatus,
  ProjectMilestoneType,
  ProjectReview,
  ProjectStatus,
  ProjectStudentDashboard,
  ProjectSubmission,
  ProjectSubmissionStatus,
  ProjectTag,
  ProjectTeam,
  ProjectTeamMemberRole,
  ProjectTeamStatus,
  ProjectType,
  ProjectVisibility,
} from '@learnova/types';

export type {
  Project,
  ProjectCategory,
  ProjectComment,
  ProjectDifficulty,
  ProjectFacultyDashboard,
  ProjectInstitutionDashboard,
  ProjectMember,
  ProjectMilestone,
  ProjectMilestoneStatus,
  ProjectMilestoneType,
  ProjectReview,
  ProjectStatus,
  ProjectStudentDashboard,
  ProjectSubmission,
  ProjectSubmissionStatus,
  ProjectTag,
  ProjectTeam,
  ProjectTeamStatus,
  ProjectType,
  ProjectVisibility,
};

/** Alias for academic project types */
export type ProjectTypeSpec = ProjectType;
export type ProjectTeamStatusSpec = ProjectTeamStatus;

export type ProjectSortOption =
  | 'newest'
  | 'oldest'
  | 'deadline'
  | 'title'
  | 'difficulty';

export type ProjectInvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface ProjectTeamInvitation {
  id: string;
  teamId: string;
  projectId: string;
  studentId: string;
  status: ProjectInvitationStatus;
  invitedBy: string;
  createdAt: string;
}

export interface MyTeamEntry {
  teamId: string;
  teamName: string;
  projectId: string;
  projectTitle: string;
  status: ProjectTeamStatus;
  memberCount: number;
  members: ProjectMember[];
  pendingInvitations: ProjectTeamInvitation[];
}

export interface ProjectListParams {
  q?: string;
  courseId?: string;
  facultyId?: string;
  moduleId?: string;
  lessonId?: string;
  status?: ProjectStatus;
  projectType?: ProjectType;
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
}

export interface ProjectListResult {
  items: Project[];
  meta: PaginatedMeta;
}

export interface MilestoneListResult {
  items: ProjectMilestone[];
  total: number;
}

export interface TeamListParams {
  projectId?: string;
  courseId?: string;
  status?: ProjectTeamStatus;
  pendingApproval?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TeamListResult {
  items: ProjectTeam[];
  meta: PaginatedMeta;
}

export interface SubmissionListParams {
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
}

export interface SubmissionListResult {
  items: ProjectSubmission[];
  meta: PaginatedMeta;
}

export interface CommentListParams {
  projectId: string;
  submissionId?: string;
  milestoneId?: string;
  resolved?: boolean;
  page?: number;
  limit?: number;
}

export interface CommentListResult {
  items: ProjectComment[];
  meta: PaginatedMeta;
}

export interface MyTeamListResult {
  items: MyTeamEntry[];
  meta: PaginatedMeta;
}

export interface BulkIdsBody { ids: string[] }
export interface BulkAssignFacultyBody { ids: string[]; facultyId: string }
export interface BulkResult { modified: number; ids?: string[] }

export interface ProjectCreateBody {
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  slug?: string;
  title: string;
  description?: string | null;
  objective?: string | null;
  problemStatement?: string | null;
  learningOutcomes?: string[];
  instructions?: string | null;
  projectType?: ProjectType;
  difficulty?: ProjectDifficulty;
  categoryId?: string | null;
  tags?: string[];
  minimumTeamSize?: number;
  maximumTeamSize?: number;
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
  lateSubmissionAllowed?: boolean;
  latePenalty?: number;
  allowResubmission?: boolean;
  maxAttempts?: number;
  publishDate?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  submissionDeadline?: string | null;
  closeDate?: string | null;
  estimatedHours?: number | null;
  rubricId?: string | null;
  assignedFacultyIds?: string[];
}

export type ProjectUpdateBody = Partial<Omit<ProjectCreateBody, 'courseId'>>;

export interface MilestoneCreateBody {
  projectId: string;
  title: string;
  description?: string | null;
  milestoneType?: ProjectMilestoneType;
  dueDate?: string | null;
  order?: number;
  weightage?: number;
}

export type MilestoneUpdateBody = Partial<Omit<MilestoneCreateBody, 'projectId'>>;

export interface TeamCreateBody {
  projectId: string;
  teamName: string;
  repoLink?: string | null;
}

export interface TeamUpdateBody {
  teamName?: string;
  repoLink?: string | null;
  status?: ProjectTeamStatus;
}

export interface JoinTeamBody {
  teamId: string;
  role?: ProjectTeamMemberRole;
}

export interface TeamInviteBody { studentId: string }
export interface TeamTransferLeadershipBody { studentId: string }
export interface TeamRejectBody { reason?: string | null }

export interface SubmitBody {
  projectId: string;
  milestoneId?: string | null;
  deliveryType?: 'text' | 'file' | 'link' | 'mixed';
  submissionText?: string | null;
  textSubmission?: string | null;
  links?: string[];
  githubRepository?: string | null;
  repoLink?: string | null;
  demoVideo?: string | null;
  liveDemoURL?: string | null;
  timeSpentMinutes?: number | null;
  attemptNumber?: number;
}

export interface MarkEvaluationReadyBody {
  notes?: string | null;
  returnToStudent?: boolean;
}

/** @deprecated Gradebook (Step 13) assigns marks */
export interface GradeBody {
  gradingMethod?: 'manual' | 'rubric' | 'pass_fail' | 'marks' | 'percentage';
  marksObtained?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  score?: number | null;
  feedback?: string | null;
  suggestions?: string | null;
  approval?: boolean | null;
  revisionRequired?: boolean | null;
  rubricScores?: { criterionId: string; points: number; comment?: string | null }[];
  returnToStudent?: boolean;
}

export interface ReviewCreateBody {
  projectId: string;
  submissionId: string;
  reviewType?: 'peer' | 'faculty';
  score?: number | null;
  rating?: number | null;
  feedback?: string | null;
  suggestions?: string | null;
  approval?: boolean | null;
  revisionRequired?: boolean | null;
  rubricScores?: { criterionId: string; points: number; comment?: string | null }[];
}

export interface ReviewSubmitBody {
  score?: number | null;
  rating?: number | null;
  feedback?: string | null;
  suggestions?: string | null;
  approval?: boolean | null;
  revisionRequired?: boolean | null;
  rubricScores?: { criterionId: string; points: number; comment?: string | null }[];
}

export interface CommentCreateBody {
  projectId: string;
  body: string;
  submissionId?: string | null;
  milestoneId?: string | null;
  parentCommentId?: string | null;
}

export interface CommentUpdateBody {
  body?: string;
  resolved?: boolean;
}
