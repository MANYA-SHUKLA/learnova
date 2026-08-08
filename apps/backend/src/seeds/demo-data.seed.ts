/**
 * Demo data seed — wires demo faculty/student into courses, enrollments,
 * assessment grades, and (after gradebook) published grades + certificates.
 */

import { Types } from 'mongoose';
import { ASSESSMENT_ENROLLMENT_STATUSES, GRADEBOOK_DEFAULTS } from '@learnova/constants';
import {
  aggregateWeightedPercentage,
  buildCourseCompletionPayload,
  buildVerificationUrl,
  defaultTitleForDocumentType,
  generateVerificationCode,
  gradePointsFromPercentage,
  letterGradeFromPercentage,
  resultFromPercentage,
  sumMarks,
} from '@learnova/shared';
import {
  AcademicYearModel,
  BatchModel,
  CampusModel,
  DepartmentModel,
  ProgramModel,
  SchoolModel,
  SectionModel,
  SemesterModel,
  UserModel,
} from '../models/index.js';
import { AssignmentGradeModel } from '../models/assignment-grade.model.js';
import { AssignmentModel } from '../models/assignment.model.js';
import { AssignmentSubmissionModel } from '../models/assignment-submission.model.js';
import { CourseGradeSummaryModel } from '../models/course-grade-summary.model.js';
import { CourseModel } from '../models/course.model.js';
import { EnrollmentModel } from '../models/enrollment.model.js';
import { FacultyModel } from '../models/faculty.model.js';
import { StudentModel } from '../models/student.model.js';
import { AcademicCertificateModel } from '../models/academic-certificate.model.js';
import { GradebookWeightSchemeModel } from '../models/gradebook-weight-scheme.model.js';
import { gradebookRepository } from '../repositories/gradebook/gradebook.repository.js';
import { listCourseIngestDrafts } from '../services/gradebook/gradebook-ingestion.js';
import { distributeWeightage, oid } from '../services/gradebook/gradebook.helpers.js';
import {
  allocateCertificateNumber,
  getPublicBaseUrl,
} from '../services/certificate/certificate.helpers.js';
import { InstitutionModel } from '../models/institution.model.js';
import { CertificateTemplateModel } from '../models/certificate-template.model.js';
import { logger } from '../utils/logger/index.js';
import type { DemoSeedResult } from './demo-users.seed.js';

const DEMO_FACULTY_EMAIL = 'faculty.demo@learnova.test';
const DEMO_STUDENT_EMAIL = 'student.demo@learnova.test';
const DEMO_COURSE_COUNT = 3;

function activeEnrollmentStatuses(): readonly string[] {
  return ASSESSMENT_ENROLLMENT_STATUSES;
}

export interface DemoDataSeedResult {
  coursesLinked: number;
  enrollments: number;
  assignmentGrades: number;
  quizResults: number;
}

export interface DemoFinalizeResult {
  publishedSummaries: number;
  certificates: number;
}

async function resolveDemoRecords(institutionId: string) {
  const instOid = oid(institutionId);
  const [faculty, student, actor] = await Promise.all([
    FacultyModel.findOne({ institutionId: instOid, email: DEMO_FACULTY_EMAIL, deletedAt: null }).exec(),
    StudentModel.findOne({ institutionId: instOid, email: DEMO_STUDENT_EMAIL, deletedAt: null }).exec(),
    UserModel.findOne({ institutionId: instOid }).select('_id').lean(),
  ]);

  if (!faculty || !student) {
    throw new Error('Demo faculty/student records missing — run seed:demo first');
  }

  return {
    faculty,
    student,
    actorUserId: actor ? String(actor._id) : String(faculty._id),
  };
}

async function alignDemoOrgStructure(
  institutionId: string,
  faculty: Awaited<ReturnType<typeof resolveDemoRecords>>['faculty'],
  student: Awaited<ReturnType<typeof resolveDemoRecords>>['student'],
) {
  const instOid = oid(institutionId);
  const [campus, school, department, program, semester, year, section, batch] = await Promise.all([
    CampusModel.findOne({ institutionId: instOid, deletedAt: null }).lean(),
    SchoolModel.findOne({ institutionId: instOid, deletedAt: null }).lean(),
    DepartmentModel.findOne({ institutionId: instOid, deletedAt: null }).lean(),
    ProgramModel.findOne({ institutionId: instOid, deletedAt: null }).lean(),
    SemesterModel.findOne({ institutionId: instOid, deletedAt: null }).lean(),
    AcademicYearModel.findOne({ institutionId: instOid, deletedAt: null }).lean(),
    SectionModel.findOne({ institutionId: instOid, deletedAt: null }).lean(),
    BatchModel.findOne({ institutionId: instOid, deletedAt: null }).lean(),
  ]);

  await FacultyModel.updateOne(
    { _id: faculty._id },
    {
      $set: {
        campusId: campus?._id ?? faculty.campusId,
        schoolId: school?._id ?? faculty.schoolId,
        departmentId: department?._id ?? faculty.departmentId,
        status: 'active',
        isActive: true,
      },
    },
  ).exec();

  await StudentModel.updateOne(
    { _id: student._id },
    {
      $set: {
        campusId: campus?._id ?? student.campusId,
        schoolId: school?._id ?? student.schoolId,
        departmentId: department?._id ?? student.departmentId,
        programId: program?._id ?? student.programId,
        semesterId: semester?._id ?? student.semesterId,
        academicYearId: year?._id ?? student.academicYearId,
        sectionId: section?._id ?? student.sectionId,
        batchId: batch?._id ?? student.batchId,
        status: 'active',
        isActive: true,
      },
    },
  ).exec();
}

/** Link demo faculty to courses and enroll demo student (run before gradebook). */
export async function seedDemoData(
  institutionId: string,
  _demo?: DemoSeedResult,
): Promise<DemoDataSeedResult> {
  const instOid = oid(institutionId);
  const { faculty, student, actorUserId } = await resolveDemoRecords(institutionId);
  await alignDemoOrgStructure(institutionId, faculty, student);

  const courses = await CourseModel.find({
    institutionId: instOid,
    deletedAt: null,
    status: { $in: ['published', 'active'] },
  })
    .sort({ createdAt: 1 })
    .limit(DEMO_COURSE_COUNT)
    .select('_id title courseCode departmentId programIds semesterIds')
    .lean()
    .exec();

  if (courses.length === 0) {
    throw new Error('No published courses found — run seed:enrollment-stack first');
  }

  const userOid = oid(actorUserId);
  let enrollmentCount = 0;

  for (const course of courses) {
    await CourseModel.updateOne(
      { _id: course._id },
      {
        $addToSet: { facultyIds: faculty._id },
        $set: { coordinatorId: faculty._id },
      },
    ).exec();

    await EnrollmentModel.findOneAndUpdate(
      {
        institutionId: instOid,
        studentId: student._id,
        courseId: course._id,
      },
      {
        $set: {
          departmentId: course.departmentId ?? null,
          programId: course.programIds?.[0] ?? null,
          semesterId: course.semesterIds?.[0] ?? null,
          facultyId: faculty._id,
          enrollmentNumber: `ENR-DEMO-${String(course._id).slice(-6).toUpperCase()}`,
          status: 'active',
          enrollmentMethod: 'manual',
          enrollmentDate: new Date(),
          approvalStatus: 'approved',
          approvedBy: userOid,
          completionStatus: 'in_progress',
          updatedBy: userOid,
          deletedAt: null,
        },
        $setOnInsert: {
          institutionId: instOid,
          studentId: student._id,
          courseId: course._id,
          createdBy: userOid,
        },
      },
      { upsert: true },
    ).exec();
    enrollmentCount += 1;
  }

  const assessment = await ensureDemoAssessmentGrades(
    institutionId,
    student._id,
    courses.map((c) => String(c._id)),
    actorUserId,
  );

  logger.info(
    {
      coursesLinked: courses.length,
      enrollments: enrollmentCount,
      ...assessment,
    },
    'Demo data seed completed',
  );

  return {
    coursesLinked: courses.length,
    enrollments: enrollmentCount,
    ...assessment,
  };
}

async function ensureDemoAssessmentGrades(
  institutionId: string,
  studentId: Types.ObjectId,
  courseIds: string[],
  actorUserId: string,
): Promise<{ assignmentGrades: number; quizResults: number }> {
  const instOid = oid(institutionId);
  const userOid = oid(actorUserId);
  let assignmentGrades = 0;

  for (const courseId of courseIds) {
    const assignment = await AssignmentModel.findOne({
      institutionId: instOid,
      courseId: oid(courseId),
      deletedAt: null,
    })
      .select('_id courseId totalMarks passingMarks')
      .lean()
      .exec();

    if (assignment) {
      const existingGrade = await AssignmentGradeModel.findOne({
        institutionId: instOid,
        assignmentId: assignment._id,
        studentId,
        deletedAt: null,
      }).exec();

      if (!existingGrade) {
        const totalMarks = assignment.totalMarks ?? 100;
        const marksObtained = Math.round(totalMarks * 0.86);
        const submissionId = new Types.ObjectId();
        const gradeId = new Types.ObjectId();
        const now = new Date();

        await AssignmentSubmissionModel.create({
          _id: submissionId,
          institutionId: instOid,
          assignmentId: assignment._id,
          courseId: assignment.courseId,
          studentId,
          attemptNumber: 1,
          submittedAt: now,
          status: 'graded',
          submissionType: 'text',
          files: [],
          textSubmission: 'Demo student submission for gradebook ingestion.',
          links: [],
          timeSpentMinutes: 90,
          lateSubmission: false,
          gradeId,
          createdBy: userOid,
          updatedBy: userOid,
          deletedAt: null,
        });

        await AssignmentGradeModel.create({
          _id: gradeId,
          institutionId: instOid,
          assignmentId: assignment._id,
          submissionId,
          studentId,
          gradingMethod: 'marks',
          marksObtained,
          percentage: Math.round((marksObtained / totalMarks) * 100),
          passed: marksObtained >= (assignment.passingMarks ?? totalMarks * 0.4),
          feedback: 'Demo grade — seeded for Learnova platform verification.',
          rubricScores: [],
          gradedBy: userOid,
          gradedAt: now,
          deletedAt: null,
        });
        assignmentGrades += 1;
      }
    }
  }

  return { assignmentGrades, quizResults: 0 };
}

/** Ensure demo student has published grades + at least one certificate (run after gradebook). */
export async function finalizeDemoStudentRecords(
  institutionId: string,
  actorUserId: string,
): Promise<DemoFinalizeResult> {
  const instOid = oid(institutionId);
  const { student } = await resolveDemoRecords(institutionId);
  const userOid = oid(actorUserId);

  const enrollments = await EnrollmentModel.find({
    institutionId: instOid,
    studentId: student._id,
    status: { $in: [...activeEnrollmentStatuses()] },
    deletedAt: null,
  })
    .select('_id courseId semesterId facultyId')
    .lean()
    .exec();

  let publishedSummaries = 0;

  for (const enrollment of enrollments) {
    const courseId = String(enrollment.courseId);

    await GradebookWeightSchemeModel.findOneAndUpdate(
      { institutionId: instOid, courseId: enrollment.courseId },
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
          updatedBy: userOid,
        },
      },
      { upsert: true },
    ).exec();

    const drafts = await listCourseIngestDrafts(institutionId, courseId, 'best');
    const studentDrafts = drafts.filter((draft) => String(draft.studentId) === String(student._id));

    for (const draft of studentDrafts) {
      await gradebookRepository.upsertEntry(draft, 0);
    }

    const entries = await gradebookRepository.listEntriesForStudentCourse(
      institutionId,
      courseId,
      String(student._id),
    );

    const schemeDoc =
      (await GradebookWeightSchemeModel.findOne({
        institutionId: instOid,
        courseId: enrollment.courseId,
      }).lean()) ?? {
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
      .filter((entry) => entry.status !== 'pending')
      .map((entry) => ({
        percentage: entry.percentage ?? 0,
        weightage: entry.weightage,
        marksObtained: entry.marksObtained ?? null,
        totalMarks: entry.totalMarks ?? null,
      }));

    const weightedPercentage =
      rows.length > 0 ? aggregateWeightedPercentage(rows) : 82;
    const marks = rows.length > 0 ? sumMarks(rows) : { earned: 82, possible: 100 };
    const now = new Date();

    await CourseGradeSummaryModel.findOneAndUpdate(
      {
        institutionId: instOid,
        courseId: enrollment.courseId,
        studentId: student._id,
      },
      {
        $set: {
          enrollmentId: enrollment._id,
          semesterId: enrollment.semesterId ?? null,
          facultyId: enrollment.facultyId ?? null,
          weightedPercentage,
          finalMarks: marks.earned,
          percentage: weightedPercentage,
          letterGrade: letterGradeFromPercentage(weightedPercentage),
          gradePoints: gradePointsFromPercentage(weightedPercentage),
          result: resultFromPercentage(weightedPercentage),
          totalMarksEarned: marks.earned,
          totalMarksPossible: marks.possible,
          entryCount: entries.length,
          status: 'published',
          published: true,
          publishedAt: now,
          locked: false,
          lockedAt: null,
          lockedBy: null,
        },
      },
      { upsert: true },
    ).exec();
    publishedSummaries += 1;
  }

  let certificates = 0;
  const existingCert = await AcademicCertificateModel.findOne({
    institutionId: instOid,
    studentId: student._id,
    status: { $in: ['issued', 'published'] },
  }).exec();

  if (!existingCert && publishedSummaries > 0) {
    const summary = await CourseGradeSummaryModel.findOne({
      institutionId: instOid,
      studentId: student._id,
      published: true,
      result: 'pass',
    }).exec();

    if (summary) {
      const [institution, course, template] = await Promise.all([
        InstitutionModel.findById(instOid).select('name logo').lean().exec(),
        CourseModel.findById(summary.courseId).select('title courseCode').lean().exec(),
        CertificateTemplateModel.findOne({ institutionId: instOid, active: true }).exec(),
      ]);

      if (institution && course) {
        const verificationCode = generateVerificationCode();
        const now = new Date();
        const certificateNumber = await allocateCertificateNumber(institutionId);
        const party = {
          institutionName: institution.name as string,
          institutionLogo: (institution.logo as string | null) ?? null,
          studentName: student.fullName,
          studentRollNumber: (student.rollNumber as string | null) ?? null,
          programName: null,
          courseTitle: course.title as string,
          courseCode: course.courseCode as string,
        };

        await AcademicCertificateModel.create({
          institutionId: instOid,
          studentId: student._id,
          certificateNumber,
          documentType: 'course_completion',
          templateId: template?._id ?? null,
          courseId: summary.courseId,
          courseGradeId: summary._id,
          verificationCode,
          verificationURL: buildVerificationUrl(getPublicBaseUrl(), verificationCode),
          status: 'published',
          revoked: false,
          title: defaultTitleForDocumentType('course_completion'),
          version: 1,
          documentPayload: buildCourseCompletionPayload(party, {
            letterGrade: summary.letterGrade ?? null,
            percentage: summary.percentage ?? null,
            gradePoints: summary.gradePoints ?? null,
            result: summary.result ?? null,
            publishedAt: summary.publishedAt?.toISOString() ?? null,
            snapshotVersion: summary.snapshotVersion ?? null,
          }),
          gradebookReference: {
            courseGradeId: summary._id,
            snapshotVersion: summary.snapshotVersion ?? null,
            semesterId: summary.semesterId ?? null,
            programId: null,
          },
          issueDate: now,
          issuedAt: now,
          publishedAt: now,
          issuedBy: userOid,
          downloadCount: 0,
        });
        certificates = 1;
      }
    }
  } else if (existingCert) {
    certificates = 1;
  }

  logger.info({ publishedSummaries, certificates }, 'Demo student records finalized');
  return { publishedSummaries, certificates };
}
