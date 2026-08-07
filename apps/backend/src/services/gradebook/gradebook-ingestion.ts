import { Types } from 'mongoose';
import type { AssessmentKind, GradebookAttemptPolicy } from '@learnova/types';
import { AssignmentGradeModel } from '../../models/assignment-grade.model.js';
import { AssignmentModel } from '../../models/assignment.model.js';
import { ExamResultModel } from '../../models/exam-result.model.js';
import { ExamModel } from '../../models/exam.model.js';
import { LabProgressModel } from '../../models/lab-progress.model.js';
import { PracticeLabModel } from '../../models/practice-lab.model.js';
import { ProjectGradeModel } from '../../models/project-grade.model.js';
import { ProjectModel } from '../../models/project.model.js';
import { ProjectSubmissionModel } from '../../models/project-submission.model.js';
import { QuizResultModel } from '../../models/quiz-result.model.js';
import { QuizModel } from '../../models/quiz.model.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { pickAttemptByPolicy, ACTIVE_ENROLLMENT_STATUSES, oid } from './gradebook.helpers.js';

export interface IngestDraft {
  institutionId: Types.ObjectId;
  courseId: Types.ObjectId;
  studentId: Types.ObjectId;
  enrollmentId: Types.ObjectId | null;
  activityKind: AssessmentKind;
  activityId: Types.ObjectId;
  activityTitle: string;
  sourceCollection: string;
  sourceRefId: Types.ObjectId;
  gradingMethod: string;
  marksObtained: number | null;
  totalMarks: number | null;
  percentage: number | null;
  passed: boolean | null;
  status: 'pending' | 'final' | 'exported';
  gradedAt: Date | null;
  gradedBy: Types.ObjectId | null;
  metadata: Record<string, unknown>;
}

async function resolveEnrollmentId(
  institutionId: Types.ObjectId,
  courseId: Types.ObjectId,
  studentId: Types.ObjectId,
): Promise<Types.ObjectId | null> {
  const enrollment = await EnrollmentModel.findOne({
    institutionId,
    courseId,
    studentId,
    status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
    deletedAt: null,
  })
    .select('_id')
    .lean()
    .exec();
  return enrollment?._id ?? null;
}

export async function ingestAssignmentGrade(sourceRefId: string): Promise<IngestDraft | null> {
  const grade = await AssignmentGradeModel.findOne({
    _id: sourceRefId,
    deletedAt: null,
  }).exec();
  if (!grade) return null;

  const assignment = await AssignmentModel.findOne({
    _id: grade.assignmentId,
    deletedAt: null,
  })
    .select('courseId title totalMarks')
    .lean()
    .exec();
  if (!assignment) return null;

  const enrollmentId = await resolveEnrollmentId(
    grade.institutionId as Types.ObjectId,
    assignment.courseId as Types.ObjectId,
    grade.studentId as Types.ObjectId,
  );

  return {
    institutionId: grade.institutionId as Types.ObjectId,
    courseId: assignment.courseId as Types.ObjectId,
    studentId: grade.studentId as Types.ObjectId,
    enrollmentId,
    activityKind: 'assignment',
    activityId: grade.assignmentId as Types.ObjectId,
    activityTitle: assignment.title,
    sourceCollection: 'assignment_grades',
    sourceRefId: grade._id,
    gradingMethod: grade.gradingMethod ?? 'marks',
    marksObtained: grade.marksObtained ?? null,
    totalMarks: assignment.totalMarks ?? null,
    percentage: grade.percentage ?? null,
    passed: grade.passed ?? null,
    status: 'final',
    gradedAt: grade.gradedAt ?? null,
    gradedBy: (grade.gradedBy as Types.ObjectId | null) ?? null,
    metadata: { submissionId: String(grade.submissionId) },
  };
}

export async function ingestQuizResult(
  sourceRefId: string,
  attemptPolicy: GradebookAttemptPolicy = 'best',
): Promise<IngestDraft | null> {
  const result = await QuizResultModel.findById(sourceRefId).exec();
  if (!result) return null;

  const quiz = await QuizModel.findOne({ _id: result.quizId, deletedAt: null })
    .select('courseId title totalMarks passingMarks')
    .lean()
    .exec();
  if (!quiz) return null;

  const allAttempts = await QuizResultModel.find({
    institutionId: result.institutionId,
    quizId: result.quizId,
    studentId: result.studentId,
  })
    .select('_id percentage score createdAt')
    .lean()
    .exec();

  const picked = pickAttemptByPolicy(
    allAttempts.map((row) => ({
      sourceRefId: row._id as Types.ObjectId,
      percentage: row.percentage ?? 0,
      score: row.score ?? 0,
      createdAt: row.createdAt as Date,
    })),
    attemptPolicy,
  );
  if (!picked) return null;

  const enrollmentId = await resolveEnrollmentId(
    result.institutionId as Types.ObjectId,
    quiz.courseId as Types.ObjectId,
    result.studentId as Types.ObjectId,
  );

  return {
    institutionId: result.institutionId as Types.ObjectId,
    courseId: quiz.courseId as Types.ObjectId,
    studentId: result.studentId as Types.ObjectId,
    enrollmentId,
    activityKind: 'quiz',
    activityId: result.quizId as Types.ObjectId,
    activityTitle: quiz.title,
    sourceCollection: 'quiz_results',
    sourceRefId: picked.sourceRefId,
    gradingMethod: 'auto',
    marksObtained: picked.score,
    totalMarks: quiz.totalMarks ?? null,
    percentage: picked.percentage,
    passed: result.passed ?? null,
    status: 'final',
    gradedAt: picked.createdAt,
    gradedBy: null,
    metadata: { attemptPolicy, attemptCount: allAttempts.length },
  };
}

export async function ingestExamResult(sourceRefId: string): Promise<IngestDraft | null> {
  const result = await ExamResultModel.findOne({
    _id: sourceRefId,
    releasedAt: { $ne: null },
  }).exec();
  if (!result) return null;

  const exam = await ExamModel.findOne({ _id: result.examId, deletedAt: null })
    .select('courseId title rules examType')
    .lean()
    .exec();
  if (!exam) return null;

  const enrollmentId = await resolveEnrollmentId(
    result.institutionId as Types.ObjectId,
    exam.courseId as Types.ObjectId,
    result.studentId as Types.ObjectId,
  );

  const rules = exam.rules as { totalMarks?: number; passingMarks?: number };

  return {
    institutionId: result.institutionId as Types.ObjectId,
    courseId: exam.courseId as Types.ObjectId,
    studentId: result.studentId as Types.ObjectId,
    enrollmentId,
    activityKind: 'exam',
    activityId: result.examId as Types.ObjectId,
    activityTitle: exam.title,
    sourceCollection: 'exam_results',
    sourceRefId: result._id,
    gradingMethod: 'auto',
    marksObtained: result.score ?? null,
    totalMarks: rules?.totalMarks ?? null,
    percentage: result.percentage ?? null,
    passed: result.passed ?? null,
    status: 'final',
    gradedAt: result.releasedAt ?? null,
    gradedBy: null,
    metadata: {
      attemptId: String(result.attemptId),
      releasedAt: result.releasedAt?.toISOString(),
      examType: (exam as { examType?: string }).examType ?? 'internal',
    },
  };
}

export async function ingestLabProgress(sourceRefId: string): Promise<IngestDraft | null> {
  const progress = await LabProgressModel.findById(sourceRefId).exec();
  if (!progress) return null;

  const lab = await PracticeLabModel.findOne({
    _id: progress.practiceLabId,
    deletedAt: null,
  })
    .select('courseId title problemCount')
    .lean()
    .exec();
  if (!lab) return null;

  const enrollmentId = await resolveEnrollmentId(
    progress.institutionId as Types.ObjectId,
    lab.courseId as Types.ObjectId,
    progress.studentId as Types.ObjectId,
  );

  const totalProblems = progress.totalProblems ?? lab.problemCount ?? 0;
  const percentage = progress.successRate ?? 0;

  return {
    institutionId: progress.institutionId as Types.ObjectId,
    courseId: lab.courseId as Types.ObjectId,
    studentId: progress.studentId as Types.ObjectId,
    enrollmentId,
    activityKind: 'lab',
    activityId: progress.practiceLabId as Types.ObjectId,
    activityTitle: lab.title,
    sourceCollection: 'lab_progress',
    sourceRefId: progress._id,
    gradingMethod: 'auto',
    marksObtained: progress.problemsSolved ?? null,
    totalMarks: totalProblems > 0 ? totalProblems : null,
    percentage,
    passed: totalProblems > 0 ? (progress.problemsSolved ?? 0) >= totalProblems : null,
    status: progress.completedAt ? 'final' : 'pending',
    gradedAt: progress.completedAt ?? progress.lastSolvedAt ?? null,
    gradedBy: null,
    metadata: {
      successRate: progress.successRate,
      problemsSolved: progress.problemsSolved,
      totalProblems,
    },
  };
}

export async function ingestProjectGrade(sourceRefId: string): Promise<IngestDraft | null> {
  const grade = await ProjectGradeModel.findOne({
    _id: sourceRefId,
    deletedAt: null,
  }).exec();
  if (!grade) return null;

  const project = await ProjectModel.findOne({ _id: grade.projectId, deletedAt: null })
    .select('courseId title totalMarks passingMarks')
    .lean()
    .exec();
  if (!project) return null;

  const studentId = grade.studentId as Types.ObjectId | null;
  if (!studentId) return null;

  const enrollmentId = await resolveEnrollmentId(
    grade.institutionId as Types.ObjectId,
    project.courseId as Types.ObjectId,
    studentId,
  );

  return {
    institutionId: grade.institutionId as Types.ObjectId,
    courseId: project.courseId as Types.ObjectId,
    studentId,
    enrollmentId,
    activityKind: 'project',
    activityId: grade.projectId as Types.ObjectId,
    activityTitle: project.title,
    sourceCollection: 'project_grades',
    sourceRefId: grade._id,
    gradingMethod: grade.gradingMethod ?? 'marks',
    marksObtained: grade.marksObtained ?? null,
    totalMarks: project.totalMarks ?? null,
    percentage: grade.percentage ?? null,
    passed: grade.passed ?? null,
    status: 'exported',
    gradedAt: grade.gradedAt ?? null,
    gradedBy: (grade.gradedBy as Types.ObjectId | null) ?? null,
    metadata: { submissionId: String(grade.submissionId) },
  };
}

export async function listCourseIngestDrafts(
  institutionId: string,
  courseId: string,
  attemptPolicy: GradebookAttemptPolicy = 'best',
): Promise<IngestDraft[]> {
  const instOid = oid(institutionId);
  const courseOid = oid(courseId);
  const drafts: IngestDraft[] = [];

  const assignmentIds = (
    await AssignmentModel.find({ institutionId: instOid, courseId: courseOid, deletedAt: null })
      .select('_id')
      .lean()
      .exec()
  ).map((row) => row._id);

  if (assignmentIds.length > 0) {
    const grades = await AssignmentGradeModel.find({
      institutionId: instOid,
      assignmentId: { $in: assignmentIds },
      deletedAt: null,
    })
      .select('_id')
      .lean()
      .exec();
    for (const grade of grades) {
      const draft = await ingestAssignmentGrade(String(grade._id));
      if (draft) drafts.push(draft);
    }
  }

  const quizIds = (
    await QuizModel.find({ institutionId: instOid, courseId: courseOid, deletedAt: null })
      .select('_id')
      .lean()
      .exec()
  ).map((row) => row._id);

  if (quizIds.length > 0) {
    const quizResults = await QuizResultModel.find({
      institutionId: instOid,
      quizId: { $in: quizIds },
    })
      .select('_id quizId studentId')
      .lean()
      .exec();

    const seen = new Set<string>();
    for (const result of quizResults) {
      const key = `${String(result.quizId)}:${String(result.studentId)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const draft = await ingestQuizResult(String(result._id), attemptPolicy);
      if (draft) drafts.push(draft);
    }
  }

  const examIds = (
    await ExamModel.find({ institutionId: instOid, courseId: courseOid, deletedAt: null })
      .select('_id')
      .lean()
      .exec()
  ).map((row) => row._id);

  if (examIds.length > 0) {
    const examResults = await ExamResultModel.find({
      institutionId: instOid,
      examId: { $in: examIds },
      releasedAt: { $ne: null },
    })
      .select('_id')
      .lean()
      .exec();
    for (const result of examResults) {
      const draft = await ingestExamResult(String(result._id));
      if (draft) drafts.push(draft);
    }
  }

  const labIds = (
    await PracticeLabModel.find({ institutionId: instOid, courseId: courseOid, deletedAt: null })
      .select('_id')
      .lean()
      .exec()
  ).map((row) => row._id);

  if (labIds.length > 0) {
    const progresses = await LabProgressModel.find({
      institutionId: instOid,
      practiceLabId: { $in: labIds },
    })
      .select('_id')
      .lean()
      .exec();
    for (const progress of progresses) {
      const draft = await ingestLabProgress(String(progress._id));
      if (draft) drafts.push(draft);
    }
  }

  const projectIds = (
    await ProjectModel.find({ institutionId: instOid, courseId: courseOid, deletedAt: null })
      .select('_id')
      .lean()
      .exec()
  ).map((row) => row._id);

  if (projectIds.length > 0) {
    const grades = await ProjectGradeModel.find({
      institutionId: instOid,
      projectId: { $in: projectIds },
      deletedAt: null,
    })
      .select('_id')
      .lean()
      .exec();
    for (const grade of grades) {
      const draft = await ingestProjectGrade(String(grade._id));
      if (draft) drafts.push(draft);
    }
  }

  return drafts;
}

export async function ingestBySource(
  activityKind: AssessmentKind,
  sourceRefId: string,
  attemptPolicy: GradebookAttemptPolicy = 'best',
): Promise<IngestDraft | null> {
  switch (activityKind) {
    case 'assignment':
      return ingestAssignmentGrade(sourceRefId);
    case 'quiz':
      return ingestQuizResult(sourceRefId, attemptPolicy);
    case 'exam':
      return ingestExamResult(sourceRefId);
    case 'lab':
      return ingestLabProgress(sourceRefId);
    case 'project':
      return ingestProjectGrade(sourceRefId);
    default:
      return null;
  }
}

export async function countPendingProjectSubmissions(
  institutionId: string,
  courseId: string,
): Promise<number> {
  return ProjectSubmissionModel.countDocuments({
    institutionId: oid(institutionId),
    courseId: oid(courseId),
    evaluationStatus: 'ready',
    deletedAt: null,
  }).exec();
}
