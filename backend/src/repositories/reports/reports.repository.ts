import { Types } from 'mongoose';
import { StudentModel } from '../../models/student.model.js';
import { CourseModel } from '../../models/course.model.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { CourseProgressModel } from '../../models/course-progress.model.js';
import { ExamModel } from '../../models/exam.model.js';
import { ExamResultModel } from '../../models/exam-result.model.js';
import { AssignmentModel } from '../../models/assignment.model.js';
import { AssignmentSubmissionModel } from '../../models/assignment-submission.model.js';
import { CourseGradeSummaryModel } from '../../models/course-grade-summary.model.js';
import { SemesterGradeModel } from '../../models/semester-grade.model.js';
import { SemesterModel } from '../../models/semester.model.js';
import { DepartmentModel } from '../../models/department.model.js';
import { studentRepository } from '../student/index.js';
import { facultyRepository } from '../faculty/index.js';
import { courseRepository } from '../course/course.repository.js';
import { enrollmentRepository } from '../enrollment/enrollment.repository.js';
import { progressRepository } from '../progress/index.js';

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

export class ReportsRepository {
  async institutionOverview(institutionId: string) {
    const [studentStats, facultyStats, courseStats, enrollmentStats, progressStats, examPass] =
      await Promise.all([
        studentRepository.stats(institutionId),
        facultyRepository.stats(institutionId),
        courseRepository.getStats(institutionId),
        enrollmentRepository.getStats(institutionId),
        progressRepository.getInstitutionAnalytics(institutionId),
        this.examPassRate(institutionId),
      ]);

    return {
      totalStudents: studentStats.active,
      totalFaculty: facultyStats.active,
      activeCourses: courseStats.published,
      totalCourses: courseStats.total,
      courseCompletionRate: progressStats.courseCompletionRate,
      studentEngagement: progressStats.studentEngagement,
      totalLearningHours: progressStats.totalLearningHours,
      activeEnrollments: enrollmentStats.active,
      completedEnrollments: enrollmentStats.completed,
      examPassPercentage: examPass.passRate,
      totalExamAttempts: examPass.totalAttempts,
      averageExamScore: examPass.averageScore,
    };
  }

  async examPassRate(institutionId: string) {
    const institutionOid = oid(institutionId);
    const [passAgg, attemptAgg] = await Promise.all([
      ExamResultModel.aggregate<{ passed: number; total: number }>([
        { $match: { institutionId: institutionOid } },
        {
          $group: {
            _id: null,
            passed: { $sum: { $cond: ['$passed', 1, 0] } },
            total: { $sum: 1 },
          },
        },
      ]).exec(),
      ExamResultModel.aggregate<{ avg: number | null; total: number }>([
        { $match: { institutionId: institutionOid } },
        { $group: { _id: null, avg: { $avg: '$percentage' }, total: { $sum: 1 } } },
      ]).exec(),
    ]);
    const passRow = passAgg[0];
    const attemptRow = attemptAgg[0];
    const total = passRow?.total ?? 0;
    return {
      passRate: total === 0 ? 0 : Math.round(((passRow?.passed ?? 0) / total) * 1000) / 10,
      totalAttempts: attemptRow?.total ?? 0,
      averageScore:
        attemptRow?.avg != null ? Math.round(attemptRow.avg * 100) / 100 : 0,
    };
  }

  async departmentReports(institutionId: string) {
    const institutionOid = oid(institutionId);
    const [studentByDept, enrollmentByDept, progressByDept] = await Promise.all([
      StudentModel.aggregate([
        { $match: { institutionId: institutionOid, deletedAt: null, status: 'active' } },
        { $group: { _id: '$departmentId', studentCount: { $sum: 1 } } },
      ]).exec(),
      EnrollmentModel.aggregate([
        { $match: { institutionId: institutionOid, deletedAt: null, status: 'completed' } },
        { $group: { _id: '$departmentId', completedEnrollments: { $sum: 1 } } },
      ]).exec(),
      CourseProgressModel.aggregate([
        { $match: { institutionId: institutionOid } },
        {
          $lookup: {
            from: 'students',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student',
          },
        },
        {
          $group: {
            _id: { $arrayElemAt: ['$student.departmentId', 0] },
            averageProgress: { $avg: '$progressPercentage' },
            completedCourses: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            totalRecords: { $sum: 1 },
          },
        },
      ]).exec(),
    ]);

    const deptIds = new Set<string>();
    for (const row of [...studentByDept, ...enrollmentByDept, ...progressByDept]) {
      if (row._id) deptIds.add(String(row._id));
    }
    const departments =
      deptIds.size > 0
        ? await DepartmentModel.find({ _id: { $in: [...deptIds].map(oid) } })
            .select('name')
            .lean()
            .exec()
        : [];
    const deptName = new Map(departments.map((d) => [String(d._id), d.name as string]));

    const merged = new Map<
      string,
      {
        departmentId: string | null;
        label: string;
        studentCount: number;
        completedEnrollments: number;
        averageProgress: number;
        completedCourses: number;
      }
    >();

    const ensure = (id: unknown) => {
      const key = id ? String(id) : '__none__';
      if (!merged.has(key)) {
        merged.set(key, {
          departmentId: id ? String(id) : null,
          label: id ? (deptName.get(String(id)) ?? 'Unknown') : 'Unassigned',
          studentCount: 0,
          completedEnrollments: 0,
          averageProgress: 0,
          completedCourses: 0,
        });
      }
      return merged.get(key)!;
    };

    for (const row of studentByDept) {
      const item = ensure(row._id);
      item.studentCount = row.studentCount as number;
    }
    for (const row of enrollmentByDept) {
      const item = ensure(row._id);
      item.completedEnrollments = row.completedEnrollments as number;
    }
    for (const row of progressByDept) {
      const item = ensure(row._id);
      item.averageProgress = Math.round((row.averageProgress as number) ?? 0);
      item.completedCourses = row.completedCourses as number;
    }

    return [...merged.values()].sort((a, b) => b.studentCount - a.studentCount);
  }

  async semesterReports(institutionId: string, semesterId?: string) {
    const match: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (semesterId) match.semesterId = oid(semesterId);

    const rows = await SemesterGradeModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$semesterId',
          studentCount: { $sum: 1 },
          averageGpa: { $avg: '$semesterGpa' },
          earnedCredits: { $sum: '$earnedCredits' },
          publishedCount: { $sum: { $cond: ['$published', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    const semesterIds = rows.map((r) => r._id).filter(Boolean);
    const semesters =
      semesterIds.length > 0
        ? await SemesterModel.find({ _id: { $in: semesterIds } })
            .select('name code')
            .lean()
            .exec()
        : [];
    const semName = new Map(
      semesters.map((s) => [String(s._id), (s.name as string) ?? 'Semester']),
    );

    return rows.map((row) => ({
      semesterId: String(row._id),
      label: semName.get(String(row._id)) ?? String(row._id),
      studentCount: row.studentCount as number,
      averageGpa: row.averageGpa != null ? Math.round(row.averageGpa * 100) / 100 : null,
      earnedCredits: row.earnedCredits as number,
      publishedCount: row.publishedCount as number,
    }));
  }

  async facultyCourseReport(institutionId: string, courseId: string) {
    const institutionOid = oid(institutionId);
    const courseOid = oid(courseId);

    const [courseProgress, assignmentStats, examStats, gradeSummaries] = await Promise.all([
      progressRepository.getFacultyCourseAnalytics(institutionId, courseId),
      this.courseAssignmentStats(institutionOid, courseOid),
      this.courseExamStats(institutionOid, courseOid),
      CourseGradeSummaryModel.find({
        institutionId: institutionOid,
        courseId: courseOid,
        published: true,
      })
        .select('studentId weightedPercentage letterGrade result status')
        .lean()
        .exec(),
    ]);

    const studentPerformance = gradeSummaries.map((row) => ({
      studentId: String(row.studentId),
      percentage: row.weightedPercentage ?? null,
      letterGrade: row.letterGrade ?? null,
      result: row.result ?? null,
    }));

    return {
      courseId,
      courseProgress,
      assignmentCompletionRate: assignmentStats.completionRate,
      assignmentSubmissions: assignmentStats.submissions,
      assignmentGraded: assignmentStats.graded,
      examPassRate: examStats.passRate,
      examAttempts: examStats.attempts,
      averageExamScore: examStats.averageScore,
      studentPerformance,
    };
  }

  private async courseAssignmentStats(institutionOid: Types.ObjectId, courseOid: Types.ObjectId) {
    const assignmentIds = await AssignmentModel.find({
      institutionId: institutionOid,
      courseId: courseOid,
      deletedAt: null,
      status: { $in: ['published', 'closed'] },
    })
      .select('_id')
      .lean()
      .exec();

    if (assignmentIds.length === 0) {
      return { completionRate: 0, submissions: 0, graded: 0 };
    }

    const ids = assignmentIds.map((a) => a._id);
    const [submissions, graded] = await Promise.all([
      AssignmentSubmissionModel.countDocuments({
        institutionId: institutionOid,
        assignmentId: { $in: ids },
        status: { $ne: 'draft' },
        deletedAt: null,
      }).exec(),
      AssignmentSubmissionModel.countDocuments({
        institutionId: institutionOid,
        assignmentId: { $in: ids },
        status: 'graded',
        deletedAt: null,
      }).exec(),
    ]);

    const enrollmentCount = await EnrollmentModel.countDocuments({
      institutionId: institutionOid,
      courseId: courseOid,
      status: 'active',
      deletedAt: null,
    }).exec();

    const expected = enrollmentCount * assignmentIds.length;
    const completionRate =
      expected === 0 ? 0 : Math.round((submissions / expected) * 1000) / 10;

    return { completionRate, submissions, graded };
  }

  private async courseExamStats(institutionOid: Types.ObjectId, courseOid: Types.ObjectId) {
    const examIds = await ExamModel.find({
      institutionId: institutionOid,
      courseId: courseOid,
      deletedAt: null,
    })
      .select('_id')
      .lean()
      .exec();

    if (examIds.length === 0) {
      return { passRate: 0, attempts: 0, averageScore: 0 };
    }

    const ids = examIds.map((e) => e._id);
    const [passAgg, scoreAgg] = await Promise.all([
      ExamResultModel.aggregate([
        { $match: { institutionId: institutionOid, examId: { $in: ids } } },
        {
          $group: {
            _id: null,
            passed: { $sum: { $cond: ['$passed', 1, 0] } },
            total: { $sum: 1 },
          },
        },
      ]).exec(),
      ExamResultModel.aggregate([
        { $match: { institutionId: institutionOid, examId: { $in: ids } } },
        { $group: { _id: null, avg: { $avg: '$percentage' }, total: { $sum: 1 } } },
      ]).exec(),
    ]);

    const passRow = passAgg[0] as { passed: number; total: number } | undefined;
    const scoreRow = scoreAgg[0] as { avg: number | null; total: number } | undefined;
    const total = passRow?.total ?? 0;

    return {
      passRate: total === 0 ? 0 : Math.round(((passRow?.passed ?? 0) / total) * 1000) / 10,
      attempts: scoreRow?.total ?? 0,
      averageScore: scoreRow?.avg != null ? Math.round(scoreRow.avg * 100) / 100 : 0,
    };
  }

  async studentReport(institutionId: string, studentId: string) {
    const institutionOid = oid(institutionId);
    const studentOid = oid(studentId);

    const [progressCounts, progressStats, gradeSummaries, semesterRows] = await Promise.all([
      progressRepository.getStudentDashboardCounts(institutionId, studentId),
      progressRepository.getStats(institutionId, studentId),
      CourseGradeSummaryModel.find({
        institutionId: institutionOid,
        studentId: studentOid,
        published: true,
      })
        .select('courseId weightedPercentage letterGrade result status')
        .lean()
        .exec(),
      SemesterGradeModel.find({ institutionId: institutionOid, studentId: studentOid })
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean()
        .exec(),
    ]);

    const courseIds = gradeSummaries.map((g) => g.courseId).filter(Boolean);
    const courses =
      courseIds.length > 0
        ? await CourseModel.find({ _id: { $in: courseIds } })
            .select('title courseCode')
            .lean()
            .exec()
        : [];
    const courseTitle = new Map(
      courses.map((c) => [String(c._id), (c.title as string) ?? (c.courseCode as string)]),
    );

    return {
      learningProgress: {
        coursesInProgress: progressCounts.coursesInProgress,
        completedCourses: progressCounts.completedCourses,
        hoursLearned: progressCounts.hoursLearned,
        lessonsCompleted: progressCounts.lessonsCompleted,
        averageProgress: progressStats.averageProgress,
      },
      grades: gradeSummaries.map((row) => ({
        courseId: String(row.courseId),
        courseTitle: courseTitle.get(String(row.courseId)) ?? 'Course',
        percentage: row.weightedPercentage ?? null,
        letterGrade: row.letterGrade ?? null,
        result: row.result ?? null,
      })),
      semesterGrades: semesterRows.map((row) => ({
        semesterId: String(row.semesterId),
        semesterGpa: row.semesterGpa ?? null,
        earnedCredits: row.earnedCredits ?? 0,
      })),
      completedCourseCount: progressCounts.completedCourses,
      attendance: null as null,
      attendanceNote: 'Class attendance tracking is not enabled. Exam check-in attendance is recorded separately.',
    };
  }
}

export const reportsRepository = new ReportsRepository();
