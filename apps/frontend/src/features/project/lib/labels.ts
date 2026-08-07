import type {
  ProjectMilestoneStatus,
  ProjectStatus,
  ProjectSubmissionStatus,
  ProjectType,
  ProjectVisibility,
} from '@learnova/types';
import type {
  ProjectDifficulty,
  ProjectMilestoneType,
  ProjectTeamStatusSpec,
  ProjectTypeSpec,
} from '../types';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
  closed: 'Closed',
};

const OPEN_STATUS_LABEL = 'Open';

const TYPE_LABELS: Record<ProjectType, string> = {
  individual: 'Individual',
  team: 'Team',
  hybrid: 'Hybrid',
};

const ACADEMIC_TYPE_LABELS: Record<string, string> = {
  mini_project: 'Mini Project',
  major_project: 'Major Project',
  capstone: 'Capstone',
  research: 'Research',
  case_study: 'Case Study',
  industry_project: 'Industry Project',
  innovation_challenge: 'Innovation Challenge',
  open_project: 'Open Project',
  individual: 'Individual',
  team: 'Team',
  hybrid: 'Hybrid',
};

const DIFFICULTY_LABELS: Record<ProjectDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

const VISIBILITY_LABELS: Record<ProjectVisibility, string> = {
  institution: 'Institution',
  enrolled: 'Enrolled',
  faculty: 'Faculty',
};

const MILESTONE_STATUS_LABELS: Record<ProjectMilestoneStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  overdue: 'Overdue',
};

const MILESTONE_TYPE_LABELS: Record<ProjectMilestoneType, string> = {
  proposal: 'Proposal',
  design: 'Design',
  implementation: 'Implementation',
  testing: 'Testing',
  documentation: 'Documentation',
  presentation: 'Presentation',
  final_submission: 'Final Submission',
  custom: 'Custom',
};

const SUBMISSION_LABELS: Record<ProjectSubmissionStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  late: 'Late',
  returned: 'Returned',
  graded: 'Graded',
  missing: 'Missing',
};

const TEAM_LABELS: Record<string, string> = {
  pending: 'Pending approval',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  forming: 'Forming',
  active: 'Active',
  dissolved: 'Dissolved',
};

export function formatProjectStatus(status: ProjectStatus | 'open') {
  if (status === 'open') return OPEN_STATUS_LABEL;
  return STATUS_LABELS[status as ProjectStatus] ?? status;
}

export function formatProjectType(type: ProjectTypeSpec | ProjectType) {
  return ACADEMIC_TYPE_LABELS[type] ?? TYPE_LABELS[type as ProjectType] ?? type;
}

export function formatProjectDifficulty(difficulty: ProjectDifficulty | null | undefined) {
  if (!difficulty) return '—';
  return DIFFICULTY_LABELS[difficulty] ?? difficulty;
}

export function formatProjectVisibility(visibility: ProjectVisibility) {
  return VISIBILITY_LABELS[visibility] ?? visibility;
}

export function formatMilestoneStatus(status: ProjectMilestoneStatus) {
  return MILESTONE_STATUS_LABELS[status] ?? status;
}

export function formatMilestoneType(type: ProjectMilestoneType | null | undefined) {
  if (!type) return '—';
  return MILESTONE_TYPE_LABELS[type] ?? type;
}

export function formatSubmissionStatus(status: ProjectSubmissionStatus) {
  return SUBMISSION_LABELS[status] ?? status;
}

export function formatTeamStatus(status: ProjectTeamStatusSpec) {
  return TEAM_LABELS[status] ?? status;
}

export function formatDueDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function formatSortOption(sort: string) {
  const labels: Record<string, string> = {
    newest: 'Newest',
    oldest: 'Oldest',
    deadline: 'Deadline',
    title: 'Title',
    difficulty: 'Difficulty',
    createdAt: 'Created',
    dueDate: 'Due date',
  };
  return labels[sort] ?? sort;
}
