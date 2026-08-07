import type {
  ProjectMilestoneStatus,
  ProjectStatus,
  ProjectSubmissionStatus,
  ProjectTeamStatus,
  ProjectType,
  ProjectVisibility,
} from '@learnova/types';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
  closed: 'Closed',
};

const TYPE_LABELS: Record<ProjectType, string> = {
  individual: 'Individual',
  team: 'Team',
  hybrid: 'Hybrid',
};

const VISIBILITY_LABELS: Record<ProjectVisibility, string> = {
  institution: 'Institution',
  enrolled: 'Enrolled',
  faculty: 'Faculty',
};

const MILESTONE_LABELS: Record<ProjectMilestoneStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  overdue: 'Overdue',
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
  forming: 'Forming',
  active: 'Active',
  dissolved: 'Dissolved',
};

export function formatProjectStatus(status: ProjectStatus) {
  return STATUS_LABELS[status] ?? status;
}

export function formatProjectType(type: ProjectType) {
  return TYPE_LABELS[type] ?? type;
}

export function formatProjectVisibility(visibility: ProjectVisibility) {
  return VISIBILITY_LABELS[visibility] ?? visibility;
}

export function formatMilestoneStatus(status: ProjectMilestoneStatus) {
  return MILESTONE_LABELS[status] ?? status;
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
