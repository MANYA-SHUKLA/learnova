import { Types } from 'mongoose';
import { AssignmentModel } from '../models/assignment.model.js';
import { AssignmentSubmissionModel } from '../models/assignment-submission.model.js';
import { AssignmentRubricModel } from '../models/assignment-rubric.model.js';
import { AssignmentGradeModel } from '../models/assignment-grade.model.js';
import { AssignmentCommentModel } from '../models/assignment-comment.model.js';
import { AssignmentAuditLogModel } from '../models/assignment-audit-log.model.js';
import { logger } from '../utils/logger/index.js';
import {
  applyLatePenalty,
  computePercentage,
  isPassing,
  rubricTotalPoints,
} from '../services/assignment/assignment.helpers.js';

const ASSIGNMENT_TYPES = [
  'homework',
  'essay',
  'research',
  'presentation',
  'case_study',
  'document_upload',
  'pdf_upload',
  'image_upload',
  'video_upload',
  'mixed',
] as const;

const STATUSES = ['draft', 'published', 'archived', 'closed'] as const;
const VISIBILITIES = ['institution', 'enrolled', 'faculty'] as const;
const SUBMISSION_TYPES = ['text', 'file', 'link', 'mixed'] as const;
const GRADING_METHODS = ['manual', 'rubric', 'pass_fail', 'marks', 'percentage'] as const;

const TITLE_PREFIXES = [
  'Weekly Problem Set',
  'Reflection Essay',
  'Literature Review',
  'Group Presentation',
  'Industry Case Study',
  'Lab Report',
  'Design Document',
  'Code Walkthrough',
  'Research Proposal',
  'Capstone Milestone',
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

export interface AssignmentSeedRefs {
  courseIds: string[];
  studentIds: string[];
  userId: string;
}

export interface SeedAssignmentOptions {
  force?: boolean;
  assignmentTarget?: number;
  submissionTarget?: number;
  rubricTarget?: number;
}

export interface AssignmentSeedResult {
  rubrics: number;
  assignments: number;
  submissions: number;
  grades: number;
  comments: number;
  auditLogs: number;
}

/**
 * Seeds a realistic assignment dataset: rubrics, assignments across courses,
 * submissions with graded/late/draft mixes, grades, threaded comments and
 * audit rows. Re-running is a no-op unless `force` is set.
 */
export async function seedAssignments(
  institutionId: string,
  refs: AssignmentSeedRefs,
  options: SeedAssignmentOptions = {},
): Promise<AssignmentSeedResult> {
  const oid = new Types.ObjectId(institutionId);
  const userOid = new Types.ObjectId(refs.userId);
  const assignmentTarget = options.assignmentTarget ?? 100;
  const submissionTarget = options.submissionTarget ?? 1000;
  const rubricTarget = options.rubricTarget ?? 12;

  logger.info({ institutionId, assignmentTarget, submissionTarget }, 'Starting assignment seed');

  const existing = await AssignmentModel.countDocuments({ institutionId: oid });
  if (existing > 0 && !options.force) {
    if (existing >= assignmentTarget) {
      logger.info({ existing }, 'Assignments already exist, skipping seed (set SEED_FORCE=1)');
      return { rubrics: 0, assignments: existing, submissions: 0, grades: 0, comments: 0, auditLogs: 0 };
    }
    logger.warn({ existing }, 'Partial assignment data found — clearing and reseeding');
  }

  if (existing > 0) {
    await Promise.all([
      AssignmentModel.deleteMany({ institutionId: oid }),
      AssignmentSubmissionModel.deleteMany({ institutionId: oid }),
      AssignmentRubricModel.deleteMany({ institutionId: oid }),
      AssignmentGradeModel.deleteMany({ institutionId: oid }),
      AssignmentCommentModel.deleteMany({ institutionId: oid }),
      AssignmentAuditLogModel.deleteMany({ institutionId: oid }),
    ]);
  }

  const now = new Date();
  const pastStart = new Date(now.getTime() - 240 * 24 * 60 * 60 * 1000);
  const futureEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // ------------------------------------------------------------------ rubrics
  const rubrics = Array.from({ length: rubricTarget }, (_, i) => {
    const criteria = Array.from({ length: randomInt(3, 5) }, (_, c) => ({
      id: new Types.ObjectId().toHexString(),
      title: `Criterion ${c + 1}`,
      description: randomBool(0.6) ? `Assesses dimension ${c + 1} of the submission.` : null,
      weight: randomInt(10, 40),
      maxPoints: randomInt(5, 25),
    }));

    return {
      _id: new Types.ObjectId(),
      institutionId: oid,
      title: `Rubric ${i + 1} — ${randomItem(TITLE_PREFIXES)}`,
      description: 'Auto-generated grading rubric for seeded assignments.',
      criteria,
      totalPoints: rubricTotalPoints(criteria),
      reusable: randomBool(0.8),
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: null,
    };
  });

  await AssignmentRubricModel.insertMany(rubrics, { ordered: false });

  // -------------------------------------------------------------- assignments
  const assignments: Record<string, unknown>[] = [];
  for (let i = 0; i < assignmentTarget; i++) {
    const courseId = new Types.ObjectId(refs.courseIds[i % refs.courseIds.length]!);
    const status = i < assignmentTarget * 0.7 ? 'published' : randomItem(STATUSES);
    const totalMarks = randomItem([20, 50, 100, 100, 150]);
    const dueDate = randomBool(0.9) ? randomDate(pastStart, futureEnd) : null;
    const closeDate =
      dueDate && randomBool(0.6)
        ? new Date(dueDate.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000)
        : null;
    const rubric = randomBool(0.4) ? randomItem(rubrics) : null;

    assignments.push({
      _id: new Types.ObjectId(),
      institutionId: oid,
      courseId,
      moduleId: null,
      lessonId: null,
      title: `${randomItem(TITLE_PREFIXES)} ${i + 1}`,
      description: `Seeded assignment ${i + 1} covering the current unit's learning outcomes.`,
      instructions: 'Submit your work before the due date. Late work may incur a penalty.',
      assignmentType: randomItem(ASSIGNMENT_TYPES),
      visibility: randomItem(VISIBILITIES),
      status,
      totalMarks,
      passingMarks: Math.round(totalMarks * 0.4),
      weightage: randomInt(0, 20),
      allowLateSubmission: randomBool(0.75),
      latePenaltyPercent: randomItem([0, 5, 10, 20]),
      allowResubmission: randomBool(0.35),
      maxAttempts: randomItem([1, 1, 2, 3]),
      publishDate: status === 'draft' ? null : randomDate(pastStart, now),
      dueDate,
      closeDate,
      estimatedMinutes: randomItem([30, 60, 90, 120, 180]),
      attachments: [],
      rubricId: rubric?._id ?? null,
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: null,
    });
  }

  await AssignmentModel.insertMany(assignments, { ordered: false });

  const submittableAssignments = assignments.filter(
    (a) => a.status === 'published' || a.status === 'closed',
  );

  // -------------------------------------------------------------- submissions
  const submissions: Record<string, unknown>[] = [];
  const grades: Record<string, unknown>[] = [];
  const comments: Record<string, unknown>[] = [];

  const usedSubmissionPairs = new Set<string>();

  outer: for (const assignment of submittableAssignments) {
    const assignmentId = assignment._id as Types.ObjectId;
    const totalMarks = assignment.totalMarks as number;
    const passingMarks = assignment.passingMarks as number;
    const latePenaltyPercent = assignment.latePenaltyPercent as number;
    const dueDate = assignment.dueDate as Date | null;

    for (const studentIdStr of refs.studentIds) {
      if (submissions.length >= submissionTarget) break outer;

      const pairKey = `${String(assignmentId)}:${studentIdStr}`;
      if (usedSubmissionPairs.has(pairKey)) continue;
      usedSubmissionPairs.add(pairKey);

      const studentId = new Types.ObjectId(studentIdStr);
      const submissionId = new Types.ObjectId();
      const late = randomBool(0.18);
      const submittedAt = dueDate
        ? late
          ? new Date(dueDate.getTime() + randomInt(1, 96) * 60 * 60 * 1000)
          : new Date(dueDate.getTime() - randomInt(1, 240) * 60 * 60 * 1000)
        : randomDate(pastStart, now);

      const roll = Math.random();
      const status =
        roll < 0.1 ? 'draft' : roll < 0.25 ? (late ? 'late' : 'submitted') : roll < 0.9 ? 'graded' : 'returned';
      const isGraded = status === 'graded' || status === 'returned';
      const gradeId = isGraded ? new Types.ObjectId() : null;

      submissions.push({
        _id: submissionId,
        institutionId: oid,
        assignmentId,
        courseId: assignment.courseId,
        studentId,
        attemptNumber: 1,
        submittedAt: status === 'draft' ? null : submittedAt,
        status,
        submissionType: randomItem(SUBMISSION_TYPES),
        files: [],
        textSubmission: randomBool(0.7) ? 'Seeded submission body text.' : null,
        links: randomBool(0.3) ? ['https://example.com/seeded-submission'] : [],
        timeSpentMinutes: randomInt(15, 300),
        lateSubmission: status === 'draft' ? false : late,
        plagiarismScore: randomBool(0.4) ? randomInt(0, 30) : null,
        gradeId,
        createdBy: userOid,
        updatedBy: userOid,
        deletedAt: null,
      });

      if (gradeId) {
        const rawMarks = randomInt(Math.round(totalMarks * 0.3), totalMarks);
        const marksObtained = late ? applyLatePenalty(rawMarks, latePenaltyPercent) : rawMarks;

        grades.push({
          _id: gradeId,
          institutionId: oid,
          assignmentId,
          submissionId,
          studentId,
          gradingMethod: randomItem(GRADING_METHODS),
          marksObtained,
          percentage: computePercentage(marksObtained, totalMarks),
          passed: isPassing(marksObtained, passingMarks),
          feedback: randomBool(0.6) ? 'Solid work — review the highlighted sections.' : null,
          rubricScores: [],
          gradedBy: userOid,
          gradedAt: new Date(submittedAt.getTime() + randomInt(1, 10) * 24 * 60 * 60 * 1000),
          deletedAt: null,
        });
      }

      if (randomBool(0.25)) {
        const parentId = new Types.ObjectId();
        comments.push({
          _id: parentId,
          institutionId: oid,
          assignmentId,
          submissionId,
          parentCommentId: null,
          authorId: userOid,
          authorRole: 'faculty',
          body: 'Please clarify your approach in section 2.',
          attachments: [],
          deletedAt: null,
        });

        if (randomBool(0.5)) {
          comments.push({
            _id: new Types.ObjectId(),
            institutionId: oid,
            assignmentId,
            submissionId,
            parentCommentId: parentId,
            authorId: userOid,
            authorRole: 'student',
            body: 'Thanks — I have added the clarification.',
            attachments: [],
            deletedAt: null,
          });
        }
      }
    }
  }

  logger.info({ count: submissions.length }, 'Inserting assignment submissions');
  if (submissions.length > 0) {
    await AssignmentSubmissionModel.insertMany(submissions, { ordered: false });
  }
  if (grades.length > 0) {
    await AssignmentGradeModel.insertMany(grades, { ordered: false });
  }
  if (comments.length > 0) {
    await AssignmentCommentModel.insertMany(comments, { ordered: false });
  }

  // -------------------------------------------------------------- audit trail
  const auditLogs = assignments.slice(0, 50).map((assignment) => ({
    event: 'assignment_created' as const,
    institutionId: oid,
    assignmentId: assignment._id as Types.ObjectId,
    submissionId: null,
    courseId: assignment.courseId as Types.ObjectId,
    studentId: null,
    userId: userOid,
    email: null,
    metadata: { source: 'seed' },
  }));

  await AssignmentAuditLogModel.insertMany(auditLogs, { ordered: false });

  const result: AssignmentSeedResult = {
    rubrics: rubrics.length,
    assignments: assignments.length,
    submissions: submissions.length,
    grades: grades.length,
    comments: comments.length,
    auditLogs: auditLogs.length,
  };

  logger.info(result, 'Assignment seed completed');
  return result;
}
