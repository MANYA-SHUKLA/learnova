/**
 * Gradebook seed — consumes existing assessment data and builds enterprise gradebook records.
 * Targets ~5000 course grades and ~10000 grade items (entries), plus appeals/comments/weights.
 */

import { Types } from 'mongoose';
import { GRADEBOOK_DEFAULTS } from '@learnova/constants';
import {
  gradePointsFromPercentage,
  letterGradeFromPercentage,
  resultFromPercentage,
} from '@learnova/shared';
import { CourseModel } from '../models/course.model.js';
import { EnrollmentModel } from '../models/enrollment.model.js';
import { CourseGradeSummaryModel } from '../models/course-grade-summary.model.js';
import { GradebookEntryModel } from '../models/gradebook-entry.model.js';
import { GradebookWeightSchemeModel } from '../models/gradebook-weight-scheme.model.js';
import { GradeAppealModel } from '../models/grade-appeal.model.js';
import { GradeCommentModel } from '../models/grade-comment.model.js';
import { GradeHistoryModel } from '../models/grade-history.model.js';
import { SemesterGradeModel } from '../models/semester-grade.model.js';
import { CGPARecordModel } from '../models/cgpa-record.model.js';
import { listCourseIngestDrafts } from '../services/gradebook/gradebook-ingestion.js';
import { gradebookRepository } from '../repositories/gradebook/gradebook.repository.js';
import { distributeWeightage, oid } from '../services/gradebook/gradebook.helpers.js';
import { aggregateWeightedPercentage, computeCgpa, computeSemesterGpa, sumMarks } from '@learnova/shared';

export interface GradebookSeedRefs {
  courseIds: string[];
  studentIds: string[];
  userId: string;
}

export interface GradebookSeedOptions {
  force?: boolean;
  gradeTarget?: number;
  itemTarget?: number;
}

export async function seedGradebook(
  institutionId: string,
  refs: GradebookSeedRefs,
  options: GradebookSeedOptions = {},
) {
  const instOid = oid(institutionId);
  const gradeTarget = options.gradeTarget ?? 5000;
  const itemTarget = options.itemTarget ?? 10000;

  if (options.force) {
    await Promise.all([
      GradebookEntryModel.deleteMany({ institutionId: instOid }),
      CourseGradeSummaryModel.deleteMany({ institutionId: instOid }),
      GradebookWeightSchemeModel.deleteMany({ institutionId: instOid }),
      GradeAppealModel.deleteMany({ institutionId: instOid }),
      GradeCommentModel.deleteMany({ institutionId: instOid }),
      GradeHistoryModel.deleteMany({ institutionId: instOid }),
      SemesterGradeModel.deleteMany({ institutionId: instOid }),
      CGPARecordModel.deleteMany({ institutionId: instOid }),
    ]);
  }

  let entryCount = 0;
  let summaryCount = 0;

  for (const courseId of refs.courseIds) {
    await GradebookWeightSchemeModel.findOneAndUpdate(
      { institutionId: instOid, courseId: oid(courseId) },
      {
        $set: {
          assignmentWeight: GRADEBOOK_DEFAULTS.ASSIGNMENT_WEIGHT,
          labWeight: GRADEBOOK_DEFAULTS.LAB_WEIGHT,
          quizWeight: GRADEBOOK_DEFAULTS.QUIZ_WEIGHT,
          midtermWeight: GRADEBOOK_DEFAULTS.MIDTERM_WEIGHT,
          finalExamWeight: GRADEBOOK_DEFAULTS.FINAL_EXAM_WEIGHT,
          examWeight: GRADEBOOK_DEFAULTS.MIDTERM_WEIGHT + GRADEBOOK_DEFAULTS.FINAL_EXAM_WEIGHT,
          projectWeight: GRADEBOOK_DEFAULTS.PROJECT_WEIGHT,
          attendanceWeight: GRADEBOOK_DEFAULTS.ATTENDANCE_WEIGHT,
          extraCreditWeight: GRADEBOOK_DEFAULTS.EXTRA_CREDIT_WEIGHT,
          attemptPolicy: GRADEBOOK_DEFAULTS.ATTEMPT_POLICY,
          updatedBy: oid(refs.userId),
        },
      },
      { upsert: true },
    );

    const drafts = await listCourseIngestDrafts(institutionId, courseId, 'best');
    const byStudent = new Map<string, typeof drafts>();
    for (const draft of drafts) {
      const sid = String(draft.studentId);
      const list = byStudent.get(sid) ?? [];
      list.push(draft);
      byStudent.set(sid, list);
    }

    const scheme = await GradebookWeightSchemeModel.findOne({
      institutionId: instOid,
      courseId: oid(courseId),
    }).lean();

    for (const [studentId, studentDrafts] of byStudent.entries()) {
      if (summaryCount >= gradeTarget) break;

      for (const draft of studentDrafts) {
        if (entryCount >= itemTarget) break;
        await gradebookRepository.upsertEntry(draft, 0);
        entryCount++;
      }

      const entries = await gradebookRepository.listEntriesForStudentCourse(
        institutionId,
        courseId,
        studentId,
      );
      const schemeDoc = scheme ?? {
        assignmentWeight: GRADEBOOK_DEFAULTS.ASSIGNMENT_WEIGHT,
        labWeight: GRADEBOOK_DEFAULTS.LAB_WEIGHT,
        quizWeight: GRADEBOOK_DEFAULTS.QUIZ_WEIGHT,
        midtermWeight: GRADEBOOK_DEFAULTS.MIDTERM_WEIGHT,
        finalExamWeight: GRADEBOOK_DEFAULTS.FINAL_EXAM_WEIGHT,
        examWeight: GRADEBOOK_DEFAULTS.MIDTERM_WEIGHT + GRADEBOOK_DEFAULTS.FINAL_EXAM_WEIGHT,
        projectWeight: GRADEBOOK_DEFAULTS.PROJECT_WEIGHT,
        attendanceWeight: GRADEBOOK_DEFAULTS.ATTENDANCE_WEIGHT,
        extraCreditWeight: GRADEBOOK_DEFAULTS.EXTRA_CREDIT_WEIGHT,
      };
      const weightMap = distributeWeightage(
        entries.map((entry) => ({
          _id: entry._id,
          activityKind: entry.activityKind,
          metadata: entry.metadata as Record<string, unknown>,
        })),
        schemeDoc as Record<string, number>,
      );
      for (const entry of entries) {
        entry.weightage = weightMap.get(String(entry._id)) ?? 0;
        await entry.save();
      }

      const rows = entries
        .filter((e) => e.status !== 'pending')
        .map((e) => ({
          percentage: e.percentage,
          weightage: e.weightage,
          marksObtained: e.marksObtained,
          totalMarks: e.totalMarks,
        }));
      const weightedPercentage = aggregateWeightedPercentage(rows);
      const marks = sumMarks(rows);
      const enrollment = await EnrollmentModel.findOne({
        institutionId: instOid,
        courseId: oid(courseId),
        studentId: oid(studentId),
      })
        .select('_id semesterId facultyId programId')
        .lean();

      const published = summaryCount % 3 === 0;
      const locked = published && summaryCount % 2 === 0;

      await CourseGradeSummaryModel.findOneAndUpdate(
        { institutionId: instOid, courseId: oid(courseId), studentId: oid(studentId) },
        {
          $set: {
            enrollmentId: enrollment?._id ?? null,
            semesterId: enrollment?.semesterId ?? null,
            facultyId: enrollment?.facultyId ?? null,
            weightedPercentage,
            finalMarks: marks.earned,
            percentage: weightedPercentage,
            letterGrade: letterGradeFromPercentage(weightedPercentage),
            gradePoints: gradePointsFromPercentage(weightedPercentage),
            result: resultFromPercentage(weightedPercentage),
            totalMarksEarned: marks.earned,
            totalMarksPossible: marks.possible,
            entryCount: entries.length,
            status: published ? 'published' : 'draft',
            published,
            publishedAt: published ? new Date() : null,
            locked,
            lockedAt: locked ? new Date() : null,
            lockedBy: locked ? oid(refs.userId) : null,
          },
        },
        { upsert: true },
      );
      summaryCount++;
    }
  }

  // Appeals (~2% of summaries)
  const summaries = await CourseGradeSummaryModel.find({
    institutionId: instOid,
    published: true,
  })
    .limit(Math.min(200, Math.floor(summaryCount * 0.02)))
    .lean();

  for (const summary of summaries) {
    await GradeAppealModel.create({
      institutionId: instOid,
      courseGradeId: summary._id,
      courseId: summary.courseId,
      studentId: summary.studentId,
      reason: 'Requesting review of consumed assessment weighting for this course grade.',
      status: summaryCount % 5 === 0 ? 'pending' : 'under_review',
      submittedAt: new Date(),
    });
  }

  // Comments
  for (const summary of summaries.slice(0, 100)) {
    await GradeCommentModel.create({
      institutionId: instOid,
      courseGradeId: summary._id,
      courseId: summary.courseId,
      studentId: summary.studentId,
      authorId: oid(refs.userId),
      visibility: 'faculty',
      body: 'Grade computed from consumed module results — no re-scoring applied.',
    });
  }

  // Semester + CGPA for subset of students
  for (const studentId of refs.studentIds.slice(0, Math.min(500, refs.studentIds.length))) {
    const studentSummaries = await CourseGradeSummaryModel.find({
      institutionId: instOid,
      studentId: oid(studentId),
      published: true,
    }).lean();

    const bySemester = new Map<string, typeof studentSummaries>();
    for (const row of studentSummaries) {
      if (!row.semesterId) continue;
      const key = String(row.semesterId);
      const list = bySemester.get(key) ?? [];
      list.push(row);
      bySemester.set(key, list);
    }

    const semesterRows: Array<{ semesterGpa: number | null; totalCredits: number }> = [];
    for (const [semesterId, rows] of bySemester.entries()) {
      const courseIds = rows.map((r) => r.courseId);
      const courses = await CourseModel.find({ _id: { $in: courseIds } })
        .select('credits')
        .lean();
      const creditMap = new Map(courses.map((c) => [String(c._id), c.credits ?? 3]));
      const semesterGpa = computeSemesterGpa(
        rows.map((r) => ({
          gradePoints: r.gradePoints,
          credits: creditMap.get(String(r.courseId)) ?? 3,
        })),
      );
      const totalCredits = rows.reduce(
        (sum, r) => sum + (creditMap.get(String(r.courseId)) ?? 3),
        0,
      );
      await SemesterGradeModel.findOneAndUpdate(
        { institutionId: instOid, studentId: oid(studentId), semesterId: oid(semesterId) },
        {
          $set: {
            semesterGpa,
            totalCredits,
            earnedCredits: totalCredits,
            courseCount: rows.length,
            published: true,
            status: 'published',
          },
        },
        { upsert: true },
      );
      semesterRows.push({ semesterGpa, totalCredits });
    }

    const cgpa = computeCgpa(semesterRows);
    await CGPARecordModel.findOneAndUpdate(
      { institutionId: instOid, studentId: oid(studentId), programId: null },
      {
        $set: {
          cgpa,
          totalCredits: semesterRows.reduce((s, r) => s + r.totalCredits, 0),
          completedCredits: semesterRows.reduce((s, r) => s + r.totalCredits, 0),
        },
      },
      { upsert: true },
    );
  }

  return { entries: entryCount, summaries: summaryCount };
}
