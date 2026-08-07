/** Enterprise Project Management constants — academic project lifecycle */

import {
  ASSESSMENT_ALLOWED_CONTENT_TYPES,
  ASSESSMENT_MAX_FILE_BYTES,
} from '../assessment/index.js';

export const PROJECT_TYPES = [
  'mini_project',
  'major_project',
  'capstone',
  'research',
  'case_study',
  'industry_project',
  'innovation_challenge',
  'open_project',
] as const;

export const PROJECT_STATUSES = ['draft', 'published', 'open', 'closed', 'archived'] as const;

export const PROJECT_VISIBILITIES = ['institution', 'enrolled', 'faculty'] as const;

export const PROJECT_DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

export const PROJECT_SUBMISSION_STATUSES = [
  'draft',
  'submitted',
  'late',
  'returned',
  'graded',
  'missing',
] as const;

export const PROJECT_DELIVERY_TYPES = ['text', 'file', 'link', 'mixed'] as const;

export const PROJECT_GRADING_METHODS = [
  'manual',
  'rubric',
  'pass_fail',
  'marks',
  'percentage',
] as const;

export const PROJECT_TEAM_STATUSES = ['pending', 'approved', 'rejected', 'completed'] as const;

export const PROJECT_TEAM_MEMBER_ROLES = ['leader', 'member'] as const;

export const PROJECT_MEMBER_INVITATION_STATUSES = ['pending', 'accepted', 'rejected'] as const;

export const PROJECT_MILESTONE_TYPES = [
  'proposal',
  'design',
  'implementation',
  'testing',
  'documentation',
  'presentation',
  'final_submission',
  'custom',
] as const;

export const PROJECT_MILESTONE_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'overdue',
] as const;

export const PROJECT_REVIEW_TYPES = ['peer', 'faculty'] as const;

export const PROJECT_REVIEW_STATUSES = ['draft', 'submitted'] as const;

export const PROJECT_PROGRESS_STATUSES = [
  'not_started',
  'in_progress',
  'submitted',
  'evaluation_ready',
] as const;

/** Evaluation export lifecycle — Gradebook (Step 13) consumes `ready` records */
export const PROJECT_EVALUATION_STATUSES = ['pending', 'ready', 'exported'] as const;

export const PROJECT_AUDIT_EVENTS = [
  'project_created',
  'project_updated',
  'project_deleted',
  'project_published',
  'project_archived',
  'project_closed',
  'team_created',
  'team_joined',
  'team_left',
  'team_dissolved',
  'team_approved',
  'team_rejected',
  'milestone_created',
  'milestone_updated',
  'milestone_completed',
  'submission_created',
  'submission_evaluation_ready',
  'review_submitted',
  'review_created',
  'comment_created',
  'attachment_uploaded',
] as const;

export type ProjectAuditEvent = (typeof PROJECT_AUDIT_EVENTS)[number];

export const PROJECT_DEFAULT_MILESTONES = [
  {
    milestoneType: 'proposal' as const,
    title: 'Project Proposal',
    description: 'Submit project proposal including objectives, scope, and timeline',
    weightage: 10,
    order: 1,
  },
  {
    milestoneType: 'design' as const,
    title: 'Design & Architecture',
    description: 'System design, wireframes, and technical architecture document',
    weightage: 15,
    order: 2,
  },
  {
    milestoneType: 'implementation' as const,
    title: 'Implementation',
    description: 'Core development and feature implementation',
    weightage: 30,
    order: 3,
  },
  {
    milestoneType: 'testing' as const,
    title: 'Testing & QA',
    description: 'Unit tests, integration tests, and quality assurance',
    weightage: 15,
    order: 4,
  },
  {
    milestoneType: 'documentation' as const,
    title: 'Documentation',
    description: 'Technical documentation and user guides',
    weightage: 10,
    order: 5,
  },
  {
    milestoneType: 'presentation' as const,
    title: 'Presentation',
    description: 'Project presentation and live demo',
    weightage: 10,
    order: 6,
  },
  {
    milestoneType: 'final_submission' as const,
    title: 'Final Submission',
    description: 'Complete project deliverables and source code',
    weightage: 10,
    order: 7,
  },
] as const;

export const PROJECT_CSV_HEADERS = [
  'id',
  'slug',
  'courseId',
  'title',
  'projectType',
  'difficulty',
  'categoryId',
  'status',
  'objective',
  'totalMarks',
  'passingMarks',
  'weightage',
  'startDate',
  'dueDate',
  'submissionDeadline',
  'minimumTeamSize',
  'maximumTeamSize',
  'allowIndividual',
  'allowTeams',
  'estimatedHours',
  'createdAt',
] as const;

/** Default max upload size for project attachments (bytes) */
export const PROJECT_MAX_FILE_BYTES = ASSESSMENT_MAX_FILE_BYTES;

export const PROJECT_ALLOWED_CONTENT_TYPES = ASSESSMENT_ALLOWED_CONTENT_TYPES;

export const PROJECT_DEFAULT_TEAM_SIZE_MIN = 1;
export const PROJECT_DEFAULT_TEAM_SIZE_MAX = 6;
export const PROJECT_MAX_TEAM_SIZE = 20;
export const PROJECT_MAX_MILESTONES = 50;
export const PROJECT_MAX_PEER_REVIEWS_REQUIRED = 10;
