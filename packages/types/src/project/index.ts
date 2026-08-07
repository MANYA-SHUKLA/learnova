import type { ID } from '../common/index.js';

export type ProjectType =
  | 'mini_project'
  | 'major_project'
  | 'capstone'
  | 'research'
  | 'case_study'
  | 'industry_project'
  | 'innovation_challenge'
  | 'open_project';

export type ProjectStatus = 'draft' | 'published' | 'open' | 'closed' | 'archived';

export type ProjectVisibility = 'institution' | 'enrolled' | 'faculty';

export type ProjectDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

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

export type ProjectTeamStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export type ProjectTeamMemberRole = 'leader' | 'member';

export type ProjectMemberInvitationStatus = 'pending' | 'accepted' | 'rejected';

export type ProjectMilestoneType =
  | 'proposal'
  | 'design'
  | 'implementation'
  | 'testing'
  | 'documentation'
  | 'presentation'
  | 'final_submission'
  | 'custom';

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

export interface ProjectResource {
  id: ID;
  title: string;
  url: string | null;
  description: string | null;
  type: 'link' | 'document' | 'video' | 'other';
}

export interface Project {
  id: ID;
  institutionId: ID;
  courseId: ID;
  moduleId: ID | null;
  lessonId: ID | null;
  slug: string;
  title: string;
  description: string | null;
  instructions: string | null;
  objective: string | null;
  problemStatement: string | null;
  learningOutcomes: string[];
  difficulty: ProjectDifficulty;
  categoryId: ID | null;
  tags: ID[];
  projectType: ProjectType;
  allowIndividual: boolean;
  allowTeams: boolean;
  minimumTeamSize: number;
  maximumTeamSize: number;
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
  startDate: string | null;
  dueDate: string | null;
  submissionDeadline: string | null;
  lateSubmissionAllowed: boolean;
  latePenalty: number;
  allowResubmission: boolean;
  maxAttempts: number;
  publishDate: string | null;
  closeDate: string | null;
  estimatedHours: number | null;
  resources: ProjectResource[];
  assignedFacultyIds: ID[];
  attachments: ProjectFileRef[];
  rubricId: ID | null;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectCategory {
  id: ID;
  institutionId: ID;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectTag {
  id: ID;
  institutionId: ID;
  name: string;
  slug: string;
  color: string | null;
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
  milestoneType: ProjectMilestoneType;
  dueDate: string | null;
  order: number;
  /** Percentage weight toward final grade (alias: weight) */
  weightage: number;
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
  teamName: string;
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

export interface ProjectMember {
  id: ID;
  institutionId: ID;
  teamId: ID;
  projectId: ID;
  studentId: ID;
  role: ProjectTeamMemberRole;
  joinedAt: string;
  approvedBy: ID | null;
  invitationStatus: ProjectMemberInvitationStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectAttachment {
  id: ID;
  institutionId: ID;
  projectId: ID | null;
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

export interface ProjectSubmission {
  id: ID;
  institutionId: ID;
  projectId: ID;
  courseId: ID;
  submittedBy: ID;
  studentId: ID | null;
  teamId: ID | null;
  milestoneId: ID | null;
  attemptNumber: number;
  submittedAt: string | null;
  status: ProjectSubmissionStatus;
  deliveryType: ProjectDeliveryType;
  submissionText: string | null;
  githubRepository: string | null;
  demoVideo: string | null;
  liveDemoURL: string | null;
  attachments: ProjectAttachment[];
  links: string[];
  timeSpentMinutes: number | null;
  lateSubmission: boolean;
  gradeId: ID | null;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectComment {
  id: ID;
  institutionId: ID;
  projectId: ID;
  submissionId: ID | null;
  milestoneId: ID | null;
  parentCommentId: ID | null;
  authorId: ID;
  authorRole: string;
  body: string;
  resolved: boolean;
  attachments: ProjectAttachment[];
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
  score: number | null;
  feedback: string | null;
  suggestions: string | null;
  approval: boolean | null;
  revisionRequired: boolean;
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

export interface ProjectInstitutionDashboard {
  totalProjects: number;
  published: number;
  active: number;
  completed: number;
  departments: Array<{ departmentId: string | null; label: string; count: number }>;
  submissionRate: number;
  facultyParticipation: number;
}

export interface ProjectFacultyDashboard {
  projectsCreated: number;
  pendingReviews: number;
  upcomingDeadlines: Array<{ projectId: string; title: string; dueDate: string }>;
  studentTeams: number;
  lateSubmissions: number;
}

export interface ProjectStudentDashboard {
  myProjects: number;
  currentTeam: ProjectTeam | null;
  milestones: Array<{ milestoneId: string; title: string; status: ProjectMilestoneStatus; dueDate: string | null }>;
  upcomingDeadlines: Array<{ projectId: string; title: string; dueDate: string }>;
  submissionHistory: Array<{ submissionId: string; projectId: string; status: ProjectSubmissionStatus; submittedAt: string | null }>;
  reviewFeedback: Array<{ reviewId: string; score: number | null; feedback: string | null }>;
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
