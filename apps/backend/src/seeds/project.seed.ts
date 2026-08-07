import { Types } from 'mongoose';
import {
  PROJECT_DEFAULT_MILESTONES,
  PROJECT_DIFFICULTIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from '@learnova/constants';
import { ProjectModel } from '../models/project.model.js';
import { ProjectMilestoneModel } from '../models/project-milestone.model.js';
import { ProjectTeamModel } from '../models/project-team.model.js';
import { ProjectMemberModel } from '../models/project-member.model.js';
import { ProjectSubmissionModel } from '../models/project-submission.model.js';
import { ProjectReviewModel } from '../models/project-review.model.js';
import { ProjectCommentModel } from '../models/project-comment.model.js';
import { ProjectTagModel } from '../models/project-tag.model.js';
import { ProjectCategoryModel } from '../models/project-category.model.js';
import { ProjectProgressModel } from '../models/project-progress.model.js';
import { ProjectAuditLogModel } from '../models/project-audit-log.model.js';
import { logger } from '../utils/logger/index.js';
import { generateSlug } from '../services/project/project.helpers.js';

const DELIVERY_TYPES = ['text', 'file', 'link', 'mixed'] as const;
const TEAM_STATUSES = ['pending', 'approved', 'rejected', 'completed'] as const;
const SUBMISSION_STATUSES = ['submitted', 'late', 'returned', 'draft'] as const;

const TITLE_PREFIXES = [
  'Capstone Build',
  'Research Sprint',
  'Product Prototype',
  'Open Source Contribution',
  'Design Studio',
  'Data Pipeline',
  'Mobile App MVP',
  'Cloud Migration',
  'AI Ethics Study',
  'Community Platform',
];

const TAG_NAMES = ['AI/ML', 'Web Dev', 'Mobile', 'IoT', 'Blockchain', 'Data Science', 'DevOps'];
const CATEGORY_NAMES = [
  'Software Engineering',
  'Research',
  'Design',
  'Infrastructure',
  'Business Analytics',
];

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export interface ProjectSeedRefs {
  courseIds: string[];
  studentIds: string[];
  userId: string;
}

export interface SeedProjectOptions {
  force?: boolean;
  projectTarget?: number;
}

export interface ProjectSeedResult {
  projects: number;
  milestones: number;
  teams: number;
  members: number;
  submissions: number;
  reviews: number;
  comments: number;
  tags: number;
  categories: number;
  grades: number;
  progress: number;
  auditLogs: number;
}

export async function seedProjects(
  institutionId: string,
  refs: ProjectSeedRefs,
  options: SeedProjectOptions = {},
): Promise<ProjectSeedResult> {
  const oid = new Types.ObjectId(institutionId);
  const userOid = new Types.ObjectId(refs.userId);
  const projectTarget = options.projectTarget ?? 50;

  logger.info({ institutionId, projectTarget }, 'Starting project seed');

  const existing = await ProjectModel.countDocuments({ institutionId: oid });
  if (existing > 0 && !options.force) {
    if (existing >= projectTarget) {
      logger.info({ existing }, 'Projects already exist, skipping seed (set SEED_FORCE=1)');
      return {
        projects: existing,
        milestones: 0,
        teams: 0,
        members: 0,
        submissions: 0,
        reviews: 0,
        comments: 0,
        tags: 0,
        categories: 0,
        grades: 0,
        progress: 0,
        auditLogs: 0,
      };
    }
    logger.warn({ existing }, 'Partial project data found — clearing and reseeding');
  }

  if (existing > 0) {
    await Promise.all([
      ProjectModel.deleteMany({ institutionId: oid }),
      ProjectMilestoneModel.deleteMany({ institutionId: oid }),
      ProjectTeamModel.deleteMany({ institutionId: oid }),
      ProjectMemberModel.deleteMany({ institutionId: oid }),
      ProjectSubmissionModel.deleteMany({ institutionId: oid }),
      ProjectReviewModel.deleteMany({ institutionId: oid }),
      ProjectCommentModel.deleteMany({ institutionId: oid }),
      ProjectTagModel.deleteMany({ institutionId: oid }),
      ProjectCategoryModel.deleteMany({ institutionId: oid }),
      ProjectProgressModel.deleteMany({ institutionId: oid }),
      ProjectAuditLogModel.deleteMany({ institutionId: oid }),
    ]);
  }

  const now = new Date();
  const pastStart = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
  const futureEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const categories = CATEGORY_NAMES.map((name, i) => ({
    _id: new Types.ObjectId(),
    institutionId: oid,
    name,
    slug: generateSlug(name),
    description: `Seeded category: ${name}`,
    color: `#${((i + 1) * 111111).toString(16).slice(0, 6)}`,
    deletedAt: null,
  }));
  await ProjectCategoryModel.insertMany(categories, { ordered: false });

  const tags = TAG_NAMES.map((name, i) => ({
    _id: new Types.ObjectId(),
    institutionId: oid,
    name,
    slug: generateSlug(name),
    color: `#${((i + 2) * 99999).toString(16).slice(0, 6)}`,
    deletedAt: null,
  }));
  await ProjectTagModel.insertMany(tags, { ordered: false });

  const projects = Array.from({ length: projectTarget }, (_, i) => {
    const courseId = new Types.ObjectId(randomItem(refs.courseIds));
    const status = randomItem(PROJECT_STATUSES);
    const dueDate = randomDate(pastStart, futureEnd);
    const totalMarks = randomInt(50, 100);
    const title = `${randomItem(TITLE_PREFIXES)} ${i + 1}`;

    return {
      _id: new Types.ObjectId(),
      institutionId: oid,
      courseId,
      moduleId: null,
      lessonId: null,
      slug: `${generateSlug(title)}-${i + 1}`,
      title,
      description: 'Seeded enterprise project for demo dashboards and workflows.',
      instructions: 'Deliver milestones on schedule; submit artifacts via the portal.',
      objective: 'Demonstrate mastery of course concepts through a practical deliverable.',
      projectType: randomItem(PROJECT_TYPES),
      difficulty: randomItem(PROJECT_DIFFICULTIES),
      categoryId: randomItem(categories)._id,
      tags: tags.slice(0, randomInt(1, 3)).map((t) => t._id),
      allowIndividual: randomBool(0.4),
      allowTeams: randomBool(0.8),
      minimumTeamSize: 2,
      maximumTeamSize: 5,
      allowSelfTeamFormation: true,
      allowPeerReview: randomBool(0.6),
      peerReviewsRequired: randomInt(0, 3),
      allowRepoLink: true,
      allowMilestones: true,
      visibility: 'enrolled',
      status,
      totalMarks,
      passingMarks: Math.floor(totalMarks * 0.4),
      weightage: randomInt(5, 25),
      lateSubmissionAllowed: randomBool(0.7),
      latePenalty: randomInt(0, 15),
      allowResubmission: randomBool(0.3),
      maxAttempts: randomInt(1, 3),
      publishDate: status !== 'draft' ? randomDate(pastStart, now) : null,
      dueDate,
      closeDate: randomBool(0.4) ? new Date(dueDate.getTime() + 7 * 86400000) : null,
      estimatedHours: randomInt(10, 50),
      attachments: [],
      assignedFacultyIds: [],
      resources: [],
      rubricId: null,
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: null,
    };
  });

  await ProjectModel.insertMany(projects, { ordered: false });

  const milestones = projects.flatMap((project) =>
    PROJECT_DEFAULT_MILESTONES.map((m, mIdx) => ({
      _id: new Types.ObjectId(),
      institutionId: oid,
      projectId: project._id,
      title: m.title,
      description: m.description,
      milestoneType: m.milestoneType,
      dueDate: randomDate(pastStart, futureEnd),
      order: m.order ?? mIdx + 1,
      weightage: m.weightage,
      status: randomItem(['pending', 'in_progress', 'completed', 'overdue'] as const),
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: null,
    })),
  );
  await ProjectMilestoneModel.insertMany(milestones, { ordered: false });

  const teamProjects = projects.filter((p) => p.allowTeams);
  const teams = Array.from({ length: Math.min(100, teamProjects.length * 2) }, (_, i) => {
    const project = teamProjects[i % teamProjects.length]!;
    const memberIds = refs.studentIds.slice(
      (i * 2) % refs.studentIds.length,
      ((i * 2) % refs.studentIds.length) + randomInt(2, 4),
    );
    if (memberIds.length === 0) memberIds.push(refs.studentIds[0]!);

    return {
      _id: new Types.ObjectId(),
      institutionId: oid,
      projectId: project._id,
      courseId: project.courseId,
      teamName: `Team ${i + 1}`,
      status: randomItem(TEAM_STATUSES),
      leaderId: new Types.ObjectId(memberIds[0]!),
      memberCount: memberIds.length,
      repoLink: randomBool(0.5) ? `https://github.com/learnova/demo-team-${i + 1}` : null,
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: null,
      _memberIds: memberIds,
    };
  });

  const teamDocs = teams.map(({ _memberIds, ...team }) => team);
  await ProjectTeamModel.insertMany(teamDocs, { ordered: false });

  const members = teams.flatMap((team) =>
    (team._memberIds as string[]).map((sid, idx) => ({
      institutionId: oid,
      teamId: team._id,
      projectId: team.projectId,
      studentId: new Types.ObjectId(sid),
      role: idx === 0 ? ('leader' as const) : ('member' as const),
      invitationStatus: 'accepted' as const,
      joinedAt: randomDate(pastStart, now),
      approvedBy: userOid,
      deletedAt: null,
    })),
  );
  await ProjectMemberModel.insertMany(members, { ordered: false });

  const submissions = projects.slice(0, 30).flatMap((project, i) =>
    Array.from({ length: Math.ceil(300 / 30) }, (_, j) => {
      const idx = i * 10 + j;
      if (idx >= 300) return null;
      const studentId = new Types.ObjectId(refs.studentIds[idx % refs.studentIds.length]!);
      const team = teams.find((t) => String(t.projectId) === String(project._id));
      const submittedAt = randomDate(pastStart, now);
      const late = project.dueDate ? submittedAt > project.dueDate : false;
      const status = randomItem(SUBMISSION_STATUSES);
      const evaluationReady = status !== 'draft' && randomBool(0.35);

      return {
        _id: new Types.ObjectId(),
        institutionId: oid,
        projectId: project._id,
        courseId: project.courseId,
        submittedBy: userOid,
        studentId,
        teamId: team?._id ?? null,
        milestoneId:
          milestones.find((m) => String(m.projectId) === String(project._id))?._id ?? null,
        attemptNumber: 1,
        submittedAt: status === 'draft' ? null : submittedAt,
        status,
        deliveryType: randomItem(DELIVERY_TYPES),
        submissionText: randomBool(0.5) ? 'Seeded project submission narrative.' : null,
        githubRepository: team?.repoLink ?? null,
        demoVideo: randomBool(0.2) ? 'https://example.com/demo.mp4' : null,
        liveDemoURL: randomBool(0.3) ? 'https://example.com/live-demo' : null,
        attachments: [],
        links: randomBool(0.4) ? ['https://example.com/demo-artifact'] : [],
        timeSpentMinutes: randomInt(30, 500),
        lateSubmission: late,
        evaluationStatus: status === 'draft' ? 'pending' : evaluationReady ? 'ready' : 'pending',
        evaluationReadyAt: evaluationReady ? submittedAt : null,
        evaluationReadyBy: evaluationReady ? userOid : null,
        evaluationNotes: null,
        gradeId: null,
        createdBy: userOid,
        updatedBy: userOid,
        deletedAt: null,
      };
    }).filter(Boolean),
  ).flat() as Record<string, unknown>[];

  await ProjectSubmissionModel.insertMany(submissions.slice(0, 300), { ordered: false });

  const reviews = submissions
    .filter((s) => s.status !== 'draft')
    .slice(0, 120)
    .map((submission, i) => ({
      _id: new Types.ObjectId(),
      institutionId: oid,
      projectId: submission.projectId,
      submissionId: submission._id,
      reviewerId: userOid,
      reviewType: i % 2 === 0 ? ('peer' as const) : ('faculty' as const),
      status: 'submitted' as const,
      score: randomInt(50, 100),
      feedback: 'Seeded review feedback.',
      suggestions: randomBool(0.5) ? 'Consider adding more test coverage.' : null,
      approval: randomBool(0.7),
      revisionRequired: randomBool(0.2),
      rubricScores: [],
      submittedAt: randomDate(pastStart, now),
      deletedAt: null,
    }));

  await ProjectReviewModel.insertMany(reviews, { ordered: false });

  const comments = submissions.slice(0, 80).flatMap((submission, i) => {
    const count = randomInt(1, 3);
    return Array.from({ length: count }, (_, j) => ({
      institutionId: oid,
      projectId: submission.projectId,
      submissionId: submission._id,
      milestoneId: null,
      parentCommentId: j > 0 ? null : null,
      authorId: userOid,
      authorRole: j % 2 === 0 ? 'faculty' : 'student',
      body: `Seeded comment ${j + 1} on submission ${i + 1}`,
      resolved: randomBool(0.3),
      attachments: [],
      deletedAt: null,
    }));
  });
  await ProjectCommentModel.insertMany(comments, { ordered: false });

  const progressRows = refs.studentIds.slice(0, 20).flatMap((studentId, i) => {
    const project = projects[i % projects.length];
    if (!project) return [];
    return [
      {
        institutionId: oid,
        projectId: project._id,
        courseId: project.courseId,
        studentId: new Types.ObjectId(studentId),
        teamId: teams.find((t) => String(t.projectId) === String(project._id))?._id ?? null,
        status: randomItem(['not_started', 'in_progress', 'submitted', 'evaluation_ready'] as const),
        milestonesCompleted: randomInt(0, 5),
        totalMilestones: milestones.filter((m) => String(m.projectId) === String(project._id))
          .length,
        peerReviewsGiven: randomInt(0, 2),
        peerReviewsRequired: project.peerReviewsRequired,
        submissionId: null,
        gradeId: null,
        lastActivityAt: randomDate(pastStart, now),
        deletedAt: null,
      },
    ];
  });

  await ProjectProgressModel.insertMany(progressRows, { ordered: false });

  const auditLogs = projects.slice(0, 20).map((project) => ({
    institutionId: oid,
    projectId: project._id,
    submissionId: null,
    teamId: null,
    milestoneId: null,
    studentId: null,
    courseId: project.courseId,
    userId: userOid,
    email: 'seed@learnova.dev',
    event: 'project_created' as const,
    metadata: { source: 'seed' },
  }));

  await ProjectAuditLogModel.insertMany(auditLogs, { ordered: false });

  return {
    projects: projects.length,
    milestones: milestones.length,
    teams: teams.length,
    members: members.length,
    submissions: Math.min(submissions.length, 300),
    reviews: reviews.length,
    comments: comments.length,
    tags: tags.length,
    categories: categories.length,
    grades: grades.length,
    progress: progressRows.length,
    auditLogs: auditLogs.length,
  };
}
