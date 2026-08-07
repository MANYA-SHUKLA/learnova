import { Types } from 'mongoose';
import { ProjectModel } from '../models/project.model.js';
import { ProjectMilestoneModel } from '../models/project-milestone.model.js';
import { ProjectTeamModel } from '../models/project-team.model.js';
import { ProjectSubmissionModel } from '../models/project-submission.model.js';
import { ProjectReviewModel } from '../models/project-review.model.js';
import { ProjectGradeModel } from '../models/project-grade.model.js';
import { ProjectProgressModel } from '../models/project-progress.model.js';
import { ProjectAuditLogModel } from '../models/project-audit-log.model.js';
import { logger } from '../utils/logger/index.js';
import { computePercentage, isPassing } from '../services/project/project.helpers.js';

const PROJECT_TYPES = ['individual', 'team', 'hybrid'] as const;
const STATUSES = ['draft', 'published', 'archived', 'closed'] as const;
const DELIVERY_TYPES = ['text', 'file', 'link', 'mixed'] as const;

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
  submissions: number;
  reviews: number;
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
  const projectTarget = options.projectTarget ?? 10;

  logger.info({ institutionId, projectTarget }, 'Starting project seed');

  const existing = await ProjectModel.countDocuments({ institutionId: oid });
  if (existing > 0 && !options.force) {
    if (existing >= projectTarget) {
      logger.info({ existing }, 'Projects already exist, skipping seed (set SEED_FORCE=1)');
      return {
        projects: existing,
        milestones: 0,
        teams: 0,
        submissions: 0,
        reviews: 0,
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
      ProjectSubmissionModel.deleteMany({ institutionId: oid }),
      ProjectReviewModel.deleteMany({ institutionId: oid }),
      ProjectGradeModel.deleteMany({ institutionId: oid }),
      ProjectProgressModel.deleteMany({ institutionId: oid }),
      ProjectAuditLogModel.deleteMany({ institutionId: oid }),
    ]);
  }

  const now = new Date();
  const pastStart = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
  const futureEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const projects = Array.from({ length: projectTarget }, (_, i) => {
    const courseId = new Types.ObjectId(randomItem(refs.courseIds));
    const status = randomItem(STATUSES);
    const dueDate = randomDate(pastStart, futureEnd);
    const totalMarks = randomInt(50, 100);

    return {
      _id: new Types.ObjectId(),
      institutionId: oid,
      courseId,
      moduleId: null,
      lessonId: null,
      title: `${randomItem(TITLE_PREFIXES)} ${i + 1}`,
      description: 'Seeded enterprise project for demo dashboards and workflows.',
      instructions: 'Deliver milestones on schedule; submit artifacts via the portal.',
      projectType: randomItem(PROJECT_TYPES),
      teamSizeMin: 2,
      teamSizeMax: 5,
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
      allowLateSubmission: randomBool(0.7),
      latePenaltyPercent: randomInt(0, 15),
      allowResubmission: randomBool(0.3),
      maxAttempts: randomInt(1, 3),
      publishDate: status !== 'draft' ? randomDate(pastStart, now) : null,
      dueDate,
      closeDate: randomBool(0.4) ? new Date(dueDate.getTime() + 7 * 86400000) : null,
      estimatedMinutes: randomInt(600, 3000),
      attachments: [],
      rubricId: null,
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: null,
    };
  });

  await ProjectModel.insertMany(projects, { ordered: false });

  const milestones = projects.flatMap((project) =>
    Array.from({ length: randomInt(2, 4) }, (_, m) => ({
      _id: new Types.ObjectId(),
      institutionId: oid,
      projectId: project._id,
      title: `Milestone ${m + 1}`,
      description: `Deliverable ${m + 1} for ${project.title}`,
      dueDate: randomDate(pastStart, futureEnd),
      order: m,
      weight: randomInt(10, 40),
      status: randomItem(['pending', 'in_progress', 'completed', 'overdue'] as const),
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: null,
    })),
  );

  await ProjectMilestoneModel.insertMany(milestones, { ordered: false });

  const teams = projects
    .filter((p) => p.projectType !== 'individual')
    .slice(0, 6)
    .map((project, i) => {
      const memberIds = refs.studentIds.slice(i * 2, i * 2 + randomInt(2, 4));
      const members = memberIds.map((sid, idx) => ({
        _id: new Types.ObjectId(),
        studentId: new Types.ObjectId(sid),
        role: idx === 0 ? ('leader' as const) : ('member' as const),
        joinedAt: randomDate(pastStart, now),
      }));

      return {
        _id: new Types.ObjectId(),
        institutionId: oid,
        projectId: project._id,
        courseId: project.courseId,
        name: `Team ${i + 1}`,
        status: members.length >= project.teamSizeMin ? 'active' : 'forming',
        leaderId: members[0]?.studentId ?? null,
        memberCount: members.length,
        repoLink: randomBool(0.5) ? `https://github.com/learnova/demo-team-${i + 1}` : null,
        members,
        createdBy: userOid,
        updatedBy: userOid,
        deletedAt: null,
      };
    });

  await ProjectTeamModel.insertMany(teams, { ordered: false });

  const submissions = projects.slice(0, 8).flatMap((project, i) => {
    const studentId = new Types.ObjectId(refs.studentIds[i % refs.studentIds.length]!);
    const team = teams.find((t) => String(t.projectId) === String(project._id));
    const submittedAt = randomDate(pastStart, now);
    const late = project.dueDate ? submittedAt > project.dueDate : false;
    const status = randomItem(['submitted', 'late', 'graded', 'draft'] as const);

    return {
      _id: new Types.ObjectId(),
      institutionId: oid,
      projectId: project._id,
      courseId: project.courseId,
      studentId,
      teamId: team?._id ?? null,
      milestoneId: milestones.find((m) => String(m.projectId) === String(project._id))?._id ?? null,
      attemptNumber: 1,
      submittedAt: status === 'draft' ? null : submittedAt,
      status,
      deliveryType: randomItem(DELIVERY_TYPES),
      files: [],
      textSubmission: randomBool(0.5) ? 'Seeded project submission narrative.' : null,
      links: randomBool(0.4) ? ['https://example.com/demo-artifact'] : [],
      repoLink: team?.repoLink ?? null,
      timeSpentMinutes: randomInt(30, 500),
      lateSubmission: late,
      gradeId: null,
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: null,
    };
  });

  await ProjectSubmissionModel.insertMany(submissions, { ordered: false });

  const grades = submissions
    .filter((s) => s.status === 'graded')
    .map((submission) => {
      const project = projects.find((p) => String(p._id) === String(submission.projectId))!;
      const marksObtained = randomInt(30, project.totalMarks);
      const percentage = computePercentage(marksObtained, project.totalMarks);

      return {
        _id: new Types.ObjectId(),
        institutionId: oid,
        projectId: submission.projectId,
        submissionId: submission._id,
        studentId: submission.studentId,
        teamId: submission.teamId,
        gradingMethod: 'marks' as const,
        marksObtained,
        percentage,
        passed: isPassing(marksObtained, project.passingMarks),
        feedback: 'Seeded faculty feedback on project deliverables.',
        rubricScores: [],
        preparedForGradebook: false,
        gradedBy: userOid,
        gradedAt: randomDate(pastStart, now),
        deletedAt: null,
      };
    });

  if (grades.length > 0) {
    await ProjectGradeModel.insertMany(grades, { ordered: false });
    for (const grade of grades) {
      await ProjectSubmissionModel.updateOne(
        { _id: grade.submissionId },
        { $set: { gradeId: grade._id } },
      ).exec();
    }
  }

  const reviews = submissions
    .filter((s) => s.status !== 'draft')
    .slice(0, 5)
    .map((submission, i) => ({
      _id: new Types.ObjectId(),
      institutionId: oid,
      projectId: submission.projectId,
      submissionId: submission._id,
      reviewerId: userOid,
      reviewType: i % 2 === 0 ? ('peer' as const) : ('faculty' as const),
      status: 'submitted' as const,
      rating: randomInt(5, 10),
      feedback: 'Seeded review feedback.',
      rubricScores: [],
      submittedAt: randomDate(pastStart, now),
      deletedAt: null,
    }));

  await ProjectReviewModel.insertMany(reviews, { ordered: false });

  const progressRows = refs.studentIds.slice(0, 5).flatMap((studentId, i) => {
    const project = projects[i % projects.length];
    if (!project) return [];
    return [
      {
        institutionId: oid,
        projectId: project._id,
        courseId: project.courseId,
        studentId: new Types.ObjectId(studentId),
        teamId: teams.find((t) => String(t.projectId) === String(project._id))?._id ?? null,
        status: randomItem(['not_started', 'in_progress', 'submitted', 'graded'] as const),
        milestonesCompleted: randomInt(0, 3),
        totalMilestones: milestones.filter((m) => String(m.projectId) === String(project._id)).length,
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

  const auditLogs = projects.slice(0, 5).map((project) => ({
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
    submissions: submissions.length,
    reviews: reviews.length,
    grades: grades.length,
    progress: progressRows.length,
    auditLogs: auditLogs.length,
  };
}
