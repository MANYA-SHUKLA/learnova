import { Types } from 'mongoose';
import { EVENTS } from '@learnova/events';
import {
  buildCourseCompletionPayload,
  buildTranscriptPayload,
  defaultTitleForDocumentType,
  generateVerificationCode,
  isCourseCompletionEligible,
  isSemesterRecordEligible,
  isStandingCertificateEligible,
  isTranscriptEligible,
  normalizeVerificationCode,
} from '@learnova/shared';
import type {
  BulkIssueCertificatesInput,
  CertificateListQuery,
  IssueCertificateInput,
  IssueTranscriptInput,
  RevokeCertificateInput,
  UpsertCertificateTemplateInput,
  VerifyCertificateQuery,
} from '@learnova/validation';
import type { CertificateDashboardStats, CertificateVerificationResult } from '@learnova/types';
import { CourseGradeSummaryModel } from '../../models/course-grade-summary.model.js';
import { CourseModel } from '../../models/course.model.js';
import { StudentModel } from '../../models/student.model.js';
import { InstitutionModel } from '../../models/institution.model.js';
import { ProgramModel } from '../../models/program.model.js';
import { SemesterModel } from '../../models/semester.model.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { AcademicStandingModel } from '../../models/academic-standing.model.js';
import { SemesterGradeModel } from '../../models/semester-grade.model.js';
import { CGPARecordModel } from '../../models/cgpa-record.model.js';
import { AcademicCertificateModel } from '../../models/academic-certificate.model.js';
import { eventBus } from '../../events/index.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors/index.js';
import { certificateRepository, oid, pageMeta, toDto } from '../../repositories/certificate/certificate.repository.js';

const MANAGE_ROLES = new Set(['institution_admin', 'super_admin']);
const WRITE_ROLES = new Set(['faculty', 'institution_admin', 'super_admin', 'teaching_assistant']);

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

function requireTenant(actor: ActorContext): string {
  if (!actor.institutionId) throw new ForbiddenError('Institution context required');
  return actor.institutionId;
}

function canManage(actor: ActorContext): boolean {
  return MANAGE_ROLES.has(actor.role);
}

function canWrite(actor: ActorContext): boolean {
  return WRITE_ROLES.has(actor.role);
}

async function resolveStudentScope(
  actor: ActorContext,
  institutionId: string,
  explicitStudentId?: string,
): Promise<string | undefined> {
  if (actor.role === 'student') {
    const student = await StudentModel.findOne({
      institutionId: oid(institutionId),
      email: actor.email.toLowerCase(),
      deletedAt: null,
    })
      .select('_id')
      .lean()
      .exec();
    if (!student) throw new NotFoundError('Student record not found');
    if (explicitStudentId && explicitStudentId !== String(student._id)) {
      throw new ForbiddenError('Students may only access their own records');
    }
    return String(student._id);
  }
  return explicitStudentId;
}

async function loadPartyInfo(
  institutionId: string,
  studentId: string,
  courseId?: string,
  programId?: string | null,
  semesterId?: string | null,
) {
  const [institution, student, course, program, semester] = await Promise.all([
    InstitutionModel.findById(institutionId).select('name logo').lean().exec(),
    StudentModel.findOne({ _id: oid(studentId), institutionId: oid(institutionId), deletedAt: null })
      .select('fullName rollNumber programId')
      .lean()
      .exec(),
    courseId
      ? CourseModel.findOne({ _id: oid(courseId), institutionId: oid(institutionId), deletedAt: null })
          .select('title code certificateEnabled')
          .lean()
          .exec()
      : null,
    programId
      ? ProgramModel.findOne({ _id: oid(programId), institutionId: oid(institutionId), deletedAt: null })
          .select('name')
          .lean()
          .exec()
      : null,
    semesterId
      ? SemesterModel.findOne({ _id: oid(semesterId), institutionId: oid(institutionId), deletedAt: null })
          .select('name code')
          .lean()
          .exec()
      : null,
  ]);

  if (!institution) throw new NotFoundError('Institution not found');
  if (!student) throw new NotFoundError('Student not found');

  return {
    institution,
    student,
    course,
    program,
    semester,
    party: {
      institutionName: institution.name as string,
      institutionLogo: (institution.logo as string | null) ?? null,
      studentName: student.fullName as string,
      studentRollNumber: (student.rollNumber as string | null) ?? null,
      programName: (program?.name as string | undefined) ?? null,
      courseTitle: (course?.title as string | undefined) ?? null,
      courseCode: (course?.code as string | undefined) ?? null,
      semesterLabel: semester ? `${semester.name ?? semester.code ?? ''}`.trim() || null : null,
    },
  };
}

async function loadPublishedSummaries(
  institutionId: string,
  studentId: string,
  filters: { courseId?: string; semesterId?: string; programId?: string },
) {
  const query: Record<string, unknown> = {
    institutionId: oid(institutionId),
    studentId: oid(studentId),
    published: true,
  };
  if (filters.courseId) query.courseId = oid(filters.courseId);
  if (filters.semesterId) query.semesterId = oid(filters.semesterId);
  return CourseGradeSummaryModel.find(query).exec();
}

export class CertificateService {
  async listTemplates(actor: ActorContext, documentType?: string) {
    const institutionId = requireTenant(actor);
    const items = await certificateRepository.listTemplates(institutionId, documentType);
    return items.map(toDto);
  }

  async upsertTemplate(
    templateId: string | null,
    input: UpsertCertificateTemplateInput,
    actor: ActorContext,
  ) {
    if (!canManage(actor)) throw new ForbiddenError('Certificate manage access required');
    const institutionId = requireTenant(actor);
    const template = await certificateRepository.upsertTemplate(institutionId, templateId, {
      ...input,
      updatedBy: oid(actor.userId),
    });
    if (!template) throw new NotFoundError('Template not found');
    await certificateRepository.appendAudit({
      institutionId,
      event: templateId ? 'template.updated' : 'template.created',
      actorId: actor.userId,
      details: { templateId: String(template._id), documentType: input.documentType },
    });
    return toDto(template);
  }

  async listCertificates(query: CertificateListQuery, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await resolveStudentScope(actor, institutionId, query.studentId);
    const scopedQuery = { ...query, studentId: studentId ?? query.studentId };
    const result = await certificateRepository.listCertificates(institutionId, scopedQuery);
    return {
      items: result.items.map(toDto),
      meta: pageMeta(result.total, result.page, result.limit),
    };
  }

  async getCertificate(certificateId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const cert = await certificateRepository.getCertificate(institutionId, certificateId);
    if (!cert) throw new NotFoundError('Certificate not found');
    if (actor.role === 'student') {
      const studentId = await resolveStudentScope(actor, institutionId);
      if (studentId !== String(cert.studentId)) throw new ForbiddenError('Access denied');
    }
    return toDto(cert);
  }

  async issueCertificate(input: IssueCertificateInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Certificate write access required');
    const institutionId = requireTenant(actor);
    await resolveStudentScope(actor, institutionId, input.studentId);

    const existingIssued = await AcademicCertificateModel.findOne({
      institutionId: oid(institutionId),
      studentId: oid(input.studentId),
      documentType: input.documentType,
      courseId: input.courseId ? oid(input.courseId) : null,
      status: 'issued',
    }).exec();
    if (existingIssued) {
      throw new ConflictError('An active certificate of this type already exists');
    }

    const { party, course } = await loadPartyInfo(
      institutionId,
      input.studentId,
      input.courseId,
      input.programId ?? null,
      input.semesterId ?? null,
    );

    let courseGradeId: Types.ObjectId | null = null;
    let snapshotVersion: number | null = null;
    let standingRecordId: Types.ObjectId | null = null;
    let documentPayload: Record<string, unknown>;
    const title = defaultTitleForDocumentType(input.documentType);

    if (input.documentType === 'course_completion') {
      if (!input.courseId) throw new ValidationError('courseId is required for course completion certificates');
      const summary = await CourseGradeSummaryModel.findOne({
        institutionId: oid(institutionId),
        courseId: oid(input.courseId),
        studentId: oid(input.studentId),
      }).exec();
      if (!summary) throw new NotFoundError('Published course grade not found');

      const eligibility = isCourseCompletionEligible(
        { published: summary.published, result: summary.result },
        course?.certificateEnabled !== false,
      );
      if (!eligibility.eligible) {
        throw new ValidationError(eligibility.reasons.join('; '));
      }

      courseGradeId = summary._id;
      snapshotVersion = summary.snapshotVersion ?? null;
      documentPayload = buildCourseCompletionPayload(
        party,
        {
          letterGrade: summary.letterGrade,
          percentage: summary.percentage,
          gradePoints: summary.gradePoints,
          result: summary.result,
          publishedAt: summary.publishedAt?.toISOString() ?? null,
          snapshotVersion,
        },
      );
    } else if (input.documentType === 'semester_record') {
      if (!input.semesterId) throw new ValidationError('semesterId is required for semester records');
      const summaries = await loadPublishedSummaries(institutionId, input.studentId, {
        semesterId: input.semesterId,
      });
      const enrollmentCount = await EnrollmentModel.countDocuments({
        institutionId: oid(institutionId),
        studentId: oid(input.studentId),
        semesterId: oid(input.semesterId),
        deletedAt: null,
      }).exec();
      const eligibility = isSemesterRecordEligible(summaries, enrollmentCount);
      if (!eligibility.eligible) throw new ValidationError(eligibility.reasons.join('; '));

      const semesterGrade = await SemesterGradeModel.findOne({
        institutionId: oid(institutionId),
        studentId: oid(input.studentId),
        semesterId: oid(input.semesterId),
      }).exec();

      documentPayload = buildTranscriptPayload({
        party,
        semesterGpa: semesterGrade?.semesterGpa ?? null,
        cgpa: null,
        academicStanding: null,
        courses: await this.buildTranscriptRows(institutionId, summaries),
      });
      documentPayload.type = 'semester_record';
    } else if (input.documentType === 'transcript') {
      const summaries = await loadPublishedSummaries(institutionId, input.studentId, {
        semesterId: input.semesterId,
        programId: input.programId,
      });
      const eligibility = isTranscriptEligible(summaries);
      if (!eligibility.eligible) throw new ValidationError(eligibility.reasons.join('; '));

      const [semesterGrade, cgpaRecord, standing] = await Promise.all([
        input.semesterId
          ? SemesterGradeModel.findOne({
              institutionId: oid(institutionId),
              studentId: oid(input.studentId),
              semesterId: oid(input.semesterId),
            }).exec()
          : null,
        CGPARecordModel.findOne({
          institutionId: oid(institutionId),
          studentId: oid(input.studentId),
        }).exec(),
        AcademicStandingModel.findOne({
          institutionId: oid(institutionId),
          studentId: oid(input.studentId),
          ...(input.semesterId ? { semesterId: oid(input.semesterId) } : { semesterId: null }),
        }).exec(),
      ]);

      documentPayload = buildTranscriptPayload({
        party,
        semesterGpa: semesterGrade?.semesterGpa ?? null,
        cgpa: cgpaRecord?.cgpa ?? null,
        academicStanding: standing?.standing ?? null,
        courses: await this.buildTranscriptRows(institutionId, summaries),
      });
    } else if (input.documentType === 'honors' || input.documentType === 'distinction') {
      const standing = await AcademicStandingModel.findOne({
        institutionId: oid(institutionId),
        studentId: oid(input.studentId),
        ...(input.semesterId ? { semesterId: oid(input.semesterId) } : {}),
      }).exec();
      const eligibility = isStandingCertificateEligible(input.documentType, standing);
      if (!eligibility.eligible) throw new ValidationError(eligibility.reasons.join('; '));
      standingRecordId = standing!._id;
      documentPayload = {
        type: input.documentType,
        institution: { name: party.institutionName, logo: party.institutionLogo },
        student: {
          name: party.studentName,
          rollNumber: party.studentRollNumber,
          program: party.programName,
        },
        standing: standing!.standing,
        disclaimer: 'Standing certificate issued from computed academic standing records.',
      };
    } else {
      throw new ValidationError('Unsupported document type');
    }

    const verificationCode = generateVerificationCode();
    const now = new Date();
    const certificate = await certificateRepository.createCertificate({
      institutionId: oid(institutionId),
      studentId: oid(input.studentId),
      documentType: input.documentType,
      templateId: input.templateId ? oid(input.templateId) : null,
      courseId: input.courseId ? oid(input.courseId) : null,
      courseGradeId,
      semesterId: input.semesterId ? oid(input.semesterId) : null,
      programId: input.programId ? oid(input.programId) : null,
      verificationCode,
      status: 'issued',
      title,
      documentPayload,
      gradebookReference: {
        courseGradeId,
        snapshotVersion,
        semesterId: input.semesterId ? oid(input.semesterId) : null,
        programId: input.programId ? oid(input.programId) : null,
        standingRecordId,
      },
      issuedAt: now,
      issuedBy: oid(actor.userId),
    });

    await certificateRepository.appendAudit({
      institutionId,
      studentId: input.studentId,
      certificateId: String(certificate._id),
      event: 'certificate.issued',
      actorId: actor.userId,
      details: { documentType: input.documentType, verificationCode },
    });
    await eventBus.emit(
      EVENTS.CERTIFICATE_GENERATED,
      { certificateId: String(certificate._id), userId: input.studentId },
      { actorId: actor.userId },
    );

    return toDto(certificate);
  }

  async bulkIssueCourseCertificates(input: BulkIssueCertificatesInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Certificate write access required');
    const institutionId = requireTenant(actor);

    const summaries = await CourseGradeSummaryModel.find({
      institutionId: oid(institutionId),
      courseId: oid(input.courseId),
      published: true,
      result: 'pass',
      ...(input.studentIds?.length
        ? { studentId: { $in: input.studentIds.map(oid) } }
        : {}),
    }).exec();

    const issued = [];
    for (const summary of summaries) {
      try {
        const cert = await this.issueCertificate(
          {
            studentId: String(summary.studentId),
            documentType: 'course_completion',
            courseId: input.courseId,
          },
          actor,
        );
        issued.push(cert);
      } catch {
        // skip ineligible or duplicate rows during bulk issue
      }
    }

    await certificateRepository.appendAudit({
      institutionId,
      event: 'certificate.bulk_issued',
      actorId: actor.userId,
      details: { courseId: input.courseId, count: issued.length },
    });

    return { issued: issued.length, items: issued };
  }

  async revokeCertificate(input: RevokeCertificateInput, actor: ActorContext) {
    if (!canManage(actor)) throw new ForbiddenError('Certificate manage access required');
    const institutionId = requireTenant(actor);
    const cert = await certificateRepository.revokeCertificate(
      institutionId,
      input.certificateId,
      actor.userId,
      input.reason,
    );
    if (!cert) throw new NotFoundError('Active certificate not found');

    await certificateRepository.appendAudit({
      institutionId,
      studentId: String(cert.studentId),
      certificateId: input.certificateId,
      event: 'certificate.revoked',
      actorId: actor.userId,
      details: { reason: input.reason },
    });
    await eventBus.emit(
      EVENTS.CERTIFICATE_REVOKED,
      { certificateId: input.certificateId },
      { actorId: actor.userId },
    );

    return toDto(cert);
  }

  async issueTranscript(input: IssueTranscriptInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Certificate write access required');
    const institutionId = requireTenant(actor);
    await resolveStudentScope(actor, institutionId, input.studentId);

    const summaries = await loadPublishedSummaries(institutionId, input.studentId, {
      semesterId: input.semesterId,
      programId: input.programId,
    });
    const eligibility = isTranscriptEligible(summaries);
    if (!eligibility.eligible) throw new ValidationError(eligibility.reasons.join('; '));

    const { party } = await loadPartyInfo(
      institutionId,
      input.studentId,
      undefined,
      input.programId ?? null,
      input.semesterId ?? null,
    );

    const [semesterGrade, cgpaRecord, standing] = await Promise.all([
      input.semesterId
        ? SemesterGradeModel.findOne({
            institutionId: oid(institutionId),
            studentId: oid(input.studentId),
            semesterId: oid(input.semesterId),
          }).exec()
        : null,
      CGPARecordModel.findOne({
        institutionId: oid(institutionId),
        studentId: oid(input.studentId),
      }).exec(),
      AcademicStandingModel.findOne({
        institutionId: oid(institutionId),
        studentId: oid(input.studentId),
        ...(input.semesterId ? { semesterId: oid(input.semesterId) } : { semesterId: null }),
      }).exec(),
    ]);

    const courses = await this.buildTranscriptRows(institutionId, summaries);
    const documentPayload = buildTranscriptPayload({
      party,
      semesterGpa: semesterGrade?.semesterGpa ?? null,
      cgpa: cgpaRecord?.cgpa ?? null,
      academicStanding: standing?.standing ?? null,
      courses,
    });

    const transcript = await certificateRepository.createTranscript({
      institutionId: oid(institutionId),
      studentId: oid(input.studentId),
      programId: input.programId ? oid(input.programId) : null,
      semesterId: input.semesterId ? oid(input.semesterId) : null,
      verificationCode: generateVerificationCode(),
      status: 'issued',
      semesterGpa: semesterGrade?.semesterGpa ?? null,
      cgpa: cgpaRecord?.cgpa ?? null,
      academicStanding: standing?.standing ?? null,
      courses,
      documentPayload,
      issuedAt: new Date(),
      issuedBy: oid(actor.userId),
    });

    await certificateRepository.appendAudit({
      institutionId,
      studentId: input.studentId,
      transcriptId: String(transcript._id),
      event: 'transcript.issued',
      actorId: actor.userId,
    });

    return toDto(transcript);
  }

  async listTranscripts(actor: ActorContext, studentId?: string, semesterId?: string) {
    const institutionId = requireTenant(actor);
    const scopedStudent = await resolveStudentScope(actor, institutionId, studentId);
    const items = await certificateRepository.listTranscripts(
      institutionId,
      scopedStudent,
      semesterId,
    );
    return items.map(toDto);
  }

  async verify(query: VerifyCertificateQuery): Promise<CertificateVerificationResult> {
    const code = normalizeVerificationCode(query.code);
    const certificate = await certificateRepository.findCertificateByVerificationCode(code);
    if (certificate) {
      const institution = await InstitutionModel.findById(certificate.institutionId)
        .select('name')
        .lean()
        .exec();
      const student = await StudentModel.findById(certificate.studentId).select('fullName').lean().exec();
      const valid = certificate.status === 'issued';
      return {
        valid,
        status: certificate.status,
        documentType: certificate.documentType,
        institutionName: (institution?.name as string | undefined) ?? null,
        studentName: (student?.fullName as string | undefined) ?? null,
        title: certificate.title,
        issuedAt: certificate.issuedAt?.toISOString() ?? null,
        revokedAt: certificate.revokedAt?.toISOString() ?? null,
        message: valid ? 'Certificate is valid' : `Certificate is ${certificate.status}`,
      };
    }

    const transcript = await certificateRepository.findTranscriptByVerificationCode(code);
    if (transcript) {
      const institution = await InstitutionModel.findById(transcript.institutionId)
        .select('name')
        .lean()
        .exec();
      const student = await StudentModel.findById(transcript.studentId).select('fullName').lean().exec();
      const valid = transcript.status === 'issued';
      return {
        valid,
        status: transcript.status,
        documentType: 'transcript',
        institutionName: (institution?.name as string | undefined) ?? null,
        studentName: (student?.fullName as string | undefined) ?? null,
        title: 'Official Academic Transcript',
        issuedAt: transcript.issuedAt?.toISOString() ?? null,
        revokedAt: transcript.revokedAt?.toISOString() ?? null,
        message: valid ? 'Transcript is valid' : `Transcript is ${transcript.status}`,
      };
    }

    return {
      valid: false,
      status: null,
      documentType: null,
      institutionName: null,
      studentName: null,
      title: null,
      issuedAt: null,
      revokedAt: null,
      message: 'Verification code not found',
    };
  }

  async institutionDashboard(actor: ActorContext): Promise<CertificateDashboardStats> {
    if (!canManage(actor)) throw new ForbiddenError('Certificate manage access required');
    const institutionId = requireTenant(actor);
    const counts = await certificateRepository.countIssued(institutionId);
    const pendingEligible = await CourseGradeSummaryModel.countDocuments({
      institutionId: oid(institutionId),
      published: true,
      result: 'pass',
    }).exec();

    return {
      issuedCount: counts.issued,
      revokedCount: counts.revoked,
      pendingEligible,
      transcriptCount: counts.transcripts,
    };
  }

  async studentDashboard(actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const studentId = await resolveStudentScope(actor, institutionId);
    if (!studentId) throw new ForbiddenError('Student context required');

    const [certificates, transcripts] = await Promise.all([
      certificateRepository.listCertificates(institutionId, {
        studentId,
        page: 1,
        limit: 100,
      }),
      certificateRepository.listTranscripts(institutionId, studentId),
    ]);

    return {
      certificateCount: certificates.items.filter((row) => row.status === 'issued').length,
      transcriptCount: transcripts.filter((row) => row.status === 'issued').length,
      recentCertificates: certificates.items.slice(0, 5).map(toDto),
    };
  }

  private async buildTranscriptRows(
    institutionId: string,
    summaries: Awaited<ReturnType<typeof loadPublishedSummaries>>,
  ) {
    const courseIds = summaries.map((row) => row.courseId);
    const courses = await CourseModel.find({
      _id: { $in: courseIds },
      institutionId: oid(institutionId),
    })
      .select('title code credits')
      .lean()
      .exec();
    const courseMap = new Map(courses.map((course) => [String(course._id), course]));

    return summaries.map((summary) => {
      const course = courseMap.get(String(summary.courseId));
      return {
        courseId: summary.courseId,
        courseCode: (course?.code as string | undefined) ?? null,
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
  }
}

export const certificateService = new CertificateService();
