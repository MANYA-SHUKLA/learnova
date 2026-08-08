/**
 * Certificate seed — issues documents from published gradebook records only.
 * Targets ~1000 certificates, ~500 transcripts, and default templates.
 */

import { CERTIFICATE_DEFAULTS } from '@learnova/constants';
import {
  buildCourseCompletionPayload,
  buildTranscriptPayload,
  buildVerificationUrl,
  defaultTitleForDocumentType,
} from '@learnova/shared';
import { generateVerificationCode } from '@learnova/shared/certificate/crypto';
import { CourseGradeSummaryModel } from '../models/course-grade-summary.model.js';
import { CourseModel } from '../models/course.model.js';
import { StudentModel } from '../models/student.model.js';
import { InstitutionModel } from '../models/institution.model.js';
import { SemesterGradeModel } from '../models/semester-grade.model.js';
import { CGPARecordModel } from '../models/cgpa-record.model.js';
import { AcademicStandingModel } from '../models/academic-standing.model.js';
import { AcademicCertificateModel } from '../models/academic-certificate.model.js';
import { AcademicTranscriptModel } from '../models/academic-transcript.model.js';
import { CertificateTemplateModel } from '../models/certificate-template.model.js';
import {
  allocateCertificateNumber,
  allocateTranscriptNumber,
  getPublicBaseUrl,
} from '../services/certificate/certificate.helpers.js';
import { oid } from '../repositories/certificate/certificate.repository.js';

export interface CertificateSeedOptions {
  force?: boolean;
  certificateTarget?: number;
  transcriptTarget?: number;
}

export async function seedCertificates(
  institutionId: string,
  actorUserId: string,
  options: CertificateSeedOptions = {},
) {
  const instOid = oid(institutionId);
  const certificateTarget = options.certificateTarget ?? 1000;
  const transcriptTarget = options.transcriptTarget ?? 500;

  if (options.force) {
    await Promise.all([
      AcademicCertificateModel.deleteMany({ institutionId: instOid }),
      AcademicTranscriptModel.deleteMany({ institutionId: instOid }),
      CertificateTemplateModel.deleteMany({ institutionId: instOid }),
    ]);
  }

  const institution = await InstitutionModel.findById(instOid).select('name logo').lean().exec();
  if (!institution) throw new Error('Institution not found for certificate seed');

  const templates = await Promise.all(
    (['course_completion', 'semester_completion', 'graduation', 'merit'] as const).map(
      (documentType, index) =>
        CertificateTemplateModel.findOneAndUpdate(
          { institutionId: instOid, name: `Default ${documentType} template` },
          {
            $setOnInsert: {
              institutionId: instOid,
              name: `Default ${documentType} template`,
              documentType,
              titleTemplate: defaultTitleForDocumentType(documentType),
              bodyTemplate: 'Awarded based on published gradebook records.',
              footerTemplate: CERTIFICATE_DEFAULTS.TITLE_COURSE,
              signatoryName: 'Registrar',
              signatoryTitle: 'Office of the Registrar',
              logoUrl: institution.logo ?? null,
              numberPrefix: CERTIFICATE_DEFAULTS.NUMBER_PREFIX,
              active: true,
              updatedBy: oid(actorUserId),
              design: {
                watermarkText: institution.name,
                primaryColor: '#1a1a1a',
              },
              signatures: [
                {
                  role: index % 2 === 0 ? 'registrar' : 'dean',
                  name: 'Registrar',
                  title: 'Office of the Registrar',
                  imageUrl: null,
                },
              ],
            },
          },
          { upsert: true, new: true },
        ).exec(),
    ),
  );

  const summaries = await CourseGradeSummaryModel.find({
    institutionId: instOid,
    published: true,
    result: 'pass',
  })
    .limit(certificateTarget * 2)
    .exec();

  let certificateCount = 0;
  for (const summary of summaries) {
    if (certificateCount >= certificateTarget) break;

    const exists = await AcademicCertificateModel.findOne({
      institutionId: instOid,
      studentId: summary.studentId,
      courseId: summary.courseId,
      documentType: 'course_completion',
      status: { $in: ['issued', 'published'] },
    }).exec();
    if (exists) continue;

    const [student, course] = await Promise.all([
      StudentModel.findById(summary.studentId).select('fullName rollNumber programId').lean().exec(),
      CourseModel.findById(summary.courseId).select('title courseCode').lean().exec(),
    ]);
    if (!student || !course) continue;

    const verificationCode = generateVerificationCode();
    const now = new Date();
    const certificateNumber = await allocateCertificateNumber(institutionId);
    const verificationURL = buildVerificationUrl(getPublicBaseUrl(), verificationCode);
    const party = {
      institutionName: institution.name as string,
      institutionLogo: (institution.logo as string | null) ?? null,
      studentName: student.fullName as string,
      studentRollNumber: (student.rollNumber as string | null) ?? null,
      programName: null,
      courseTitle: course.title as string,
      courseCode: course.courseCode as string,
    };

    await AcademicCertificateModel.create({
      institutionId: instOid,
      studentId: summary.studentId,
      certificateNumber,
      documentType: 'course_completion',
      templateId: templates[0]?._id ?? null,
      courseId: summary.courseId,
      courseGradeId: summary._id,
      verificationCode,
      verificationURL,
      status: certificateCount % 3 === 0 ? 'published' : 'issued',
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
      publishedAt: certificateCount % 3 === 0 ? now : null,
      issuedBy: oid(actorUserId),
      downloadCount: certificateCount % 5,
    });

    certificateCount += 1;
  }

  // Fill remaining target with alternate document types (merit) from published passes.
  if (certificateCount < certificateTarget) {
    const extraSummaries = await CourseGradeSummaryModel.find({
      institutionId: instOid,
      published: true,
      result: 'pass',
    })
      .limit((certificateTarget - certificateCount) * 3)
      .exec();

    for (const summary of extraSummaries) {
      if (certificateCount >= certificateTarget) break;

      for (const documentType of ['merit', 'semester_completion'] as const) {
        if (certificateCount >= certificateTarget) break;

        const exists = await AcademicCertificateModel.findOne({
          institutionId: instOid,
          studentId: summary.studentId,
          courseId: summary.courseId,
          documentType,
          status: { $in: ['issued', 'published'] },
        }).exec();
        if (exists) continue;

        const [student, course] = await Promise.all([
          StudentModel.findById(summary.studentId).select('fullName rollNumber programId').lean().exec(),
          CourseModel.findById(summary.courseId).select('title courseCode').lean().exec(),
        ]);
        if (!student || !course) continue;

        const verificationCode = generateVerificationCode();
        const now = new Date();
        const certificateNumber = await allocateCertificateNumber(institutionId);
        const party = {
          institutionName: institution.name as string,
          institutionLogo: (institution.logo as string | null) ?? null,
          studentName: student.fullName as string,
          studentRollNumber: (student.rollNumber as string | null) ?? null,
          programName: null,
          courseTitle: course.title as string,
          courseCode: course.courseCode as string,
        };

        await AcademicCertificateModel.create({
          institutionId: instOid,
          studentId: summary.studentId,
          certificateNumber,
          documentType,
          templateId: templates[0]?._id ?? null,
          courseId: summary.courseId,
          courseGradeId: summary._id,
          verificationCode,
          verificationURL: buildVerificationUrl(getPublicBaseUrl(), verificationCode),
          status: certificateCount % 3 === 0 ? 'published' : 'issued',
          revoked: false,
          title: defaultTitleForDocumentType(documentType),
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
          publishedAt: certificateCount % 3 === 0 ? now : null,
          issuedBy: oid(actorUserId),
          downloadCount: 0,
        });
        certificateCount += 1;
      }
    }
  }

  const students = await StudentModel.find({ institutionId: instOid, deletedAt: null })
    .select('_id fullName rollNumber programId')
    .limit(transcriptTarget * 2)
    .lean()
    .exec();

  let transcriptCount = 0;
  for (const student of students) {
    if (transcriptCount >= transcriptTarget) break;

    const summariesForStudent = await CourseGradeSummaryModel.find({
      institutionId: instOid,
      studentId: student._id,
      published: true,
    }).exec();
    if (summariesForStudent.length === 0) continue;

    const exists = await AcademicTranscriptModel.findOne({
      institutionId: instOid,
      studentId: student._id,
      transcriptType: 'official',
      status: { $in: ['issued', 'published'] },
    }).exec();
    if (exists) continue;

    const courseIds = summariesForStudent.map((row) => row.courseId);
    const courses = await CourseModel.find({ _id: { $in: courseIds } })
      .select('title courseCode credits')
      .lean()
      .exec();
    const courseMap = new Map(courses.map((course) => [String(course._id), course]));

    const rows = summariesForStudent.map((summary) => {
      const course = courseMap.get(String(summary.courseId));
      return {
        courseId: summary.courseId,
        courseCode: (course?.courseCode as string | undefined) ?? null,
        courseTitle: (course?.title as string | undefined) ?? 'Course',
        credits: (course?.credits as number | undefined) ?? 0,
        letterGrade: summary.letterGrade,
        gradePoints: summary.gradePoints,
        percentage: summary.percentage,
        result: summary.result,
        semesterId: summary.semesterId,
        publishedAt: summary.publishedAt,
      };
    });

    const [semesterGrade, cgpaRecord, standing] = await Promise.all([
      SemesterGradeModel.findOne({ institutionId: instOid, studentId: student._id }).exec(),
      CGPARecordModel.findOne({ institutionId: instOid, studentId: student._id }).exec(),
      AcademicStandingModel.findOne({ institutionId: instOid, studentId: student._id }).exec(),
    ]);

    const party = {
      institutionName: institution.name as string,
      institutionLogo: (institution.logo as string | null) ?? null,
      studentName: student.fullName as string,
      studentRollNumber: (student.rollNumber as string | null) ?? null,
      programName: null,
    };

    const verificationCode = generateVerificationCode();
    const now = new Date();
    const transcriptNumber = await allocateTranscriptNumber(institutionId);

    await AcademicTranscriptModel.create({
      institutionId: instOid,
      studentId: student._id,
      transcriptNumber,
      transcriptType: 'official',
      programId: student.programId ?? null,
      verificationCode,
      verificationURL: buildVerificationUrl(getPublicBaseUrl(), verificationCode),
      status: 'published',
      version: 1,
      semesterGpa: semesterGrade?.semesterGpa ?? null,
      cgpa: cgpaRecord?.cgpa ?? null,
      academicStanding: standing?.standing ?? null,
      courses: rows,
      documentPayload: buildTranscriptPayload({
        party,
        semesterGpa: semesterGrade?.semesterGpa ?? null,
        cgpa: cgpaRecord?.cgpa ?? null,
        academicStanding: standing?.standing ?? null,
        courses: rows.map((row) => ({
          courseId: String(row.courseId),
          semesterId: row.semesterId ? String(row.semesterId) : null,
          publishedAt: row.publishedAt?.toISOString() ?? null,
          courseCode: row.courseCode,
          courseTitle: row.courseTitle,
          credits: row.credits,
          letterGrade: row.letterGrade ?? null,
          gradePoints: row.gradePoints ?? null,
          percentage: row.percentage ?? null,
          result: row.result ?? null,
        })),
      }),
      issuedAt: now,
      issuedBy: oid(actorUserId),
      downloadCount: 0,
    });

    transcriptCount += 1;
  }

  return {
    templates: templates.length,
    certificates: certificateCount,
    transcripts: transcriptCount,
  };
}
