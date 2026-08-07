import type {
  ProjectMilestoneStatus,
  ProjectMilestoneType,
  ProjectStatus,
  ProjectSubmissionStatus,
  ProjectTeamStatus,
  ProjectType,
  ProjectVisibility,
  ProjectDifficulty,
} from '@learnova/types';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  open: 'Open',
  archived: 'Archived',
  closed: 'Closed',
};

const TYPE_LABELS: Record<ProjectType, string> = {
  mini_project: 'Mini Project',
  major_project: 'Major Project',
  capstone: 'Capstone',
  research: 'Research',
  case_study: 'Case Study',
  industry_project: 'Industry Project',
  innovation_challenge: 'Innovation Challenge',
  open_project: 'Open Project',
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

const TEAM_LABELS: Record<ProjectTeamStatus, string> = {
  pending: 'Pending approval',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};

export function formatProjectStatus(status: ProjectStatus) {
  return STATUS_LABELS[status] ?? status;
}

export function formatProjectType(type: ProjectType) {
  return TYPE_LABELS[type] ?? type;
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

export function formatTeamStatus(status: ProjectTeamStatus) {
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
