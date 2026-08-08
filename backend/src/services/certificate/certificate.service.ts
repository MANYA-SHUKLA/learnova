import { EVENTS } from '@learnova/events';
import {
  buildTranscriptPayload,
  buildVerificationUrl,
  defaultTitleForDocumentType,
  isTranscriptEligible,
  normalizeDocumentType,
  renderCertificateHtml,
} from '@learnova/shared';
import {
  generateVerificationCode,
  normalizeVerificationCode,
} from '@learnova/shared/certificate/crypto';
import type {
  BulkIssueCertificatesInput,
  CertificateListQuery,
  GenerateAcademicRecordInput,
  IssueCertificateInput,
  IssueTranscriptInput,
  PublishCertificateInput,
  RegistryExportQuery,
  RevokeCertificateInput,
  UpsertCertificateTemplateInput,
  VerifyCertificateQuery,
} from '@learnova/validation';
import type {
  CertificateDashboardStats,
  CertificateVerificationResult,
  TranscriptCourseRow,
} from '@learnova/types';
import { CourseGradeSummaryModel } from '../../models/course-grade-summary.model.js';
import { CourseModel } from '../../models/course.model.js';
import { StudentModel } from '../../models/student.model.js';
import { InstitutionModel } from '../../models/institution.model.js';
import { ProgramModel } from '../../models/program.model.js';
import { SemesterModel } from '../../models/semester.model.js';
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
import {
  allocateCertificateNumber,
  allocateTranscriptNumber,
  getPublicBaseUrl,
  rowsToCsv,
} from './certificate.helpers.js';
import { assertCertificateEligible } from './certificate-eligibility.service.js';
import { buildCertificatePayload } from './certificate-payload.service.js';

const ACTIVE_CERTIFICATE_STATUSES = new Set(['issued', 'published']);

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
          .select('title courseCode certificateEnabled')
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
          .select('name')
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
      courseCode: (course?.courseCode as string | undefined) ?? null,
      semesterLabel: semester ? `${semester.name ?? ''}`.trim() || null : null,
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

    const existingIssued = await certificateRepository.findActiveCertificate({
      institutionId: oid(institutionId),
      studentId: oid(input.studentId),
      documentType: input.documentType,
      courseId: input.courseId ? oid(input.courseId) : null,
    });
    if (existingIssued) {
      throw new ConflictError('An active certificate of this type already exists');
    }

    const eligibility = await assertCertificateEligible({
      institutionId,
      studentId: input.studentId,
      documentType: input.documentType,
      courseId: input.courseId,
      semesterId: input.semesterId,
      programId: input.programId,
      activityId: input.activityId,
    });

    const { party } = await loadPartyInfo(
      institutionId,
      input.studentId,
      input.courseId,
      input.programId ?? null,
      input.semesterId ?? null,
    );

    let transcriptRows: TranscriptCourseRow[] = [];
    let semesterGpa: number | null = null;
    let cgpa: number | null = null;
    let academicStanding: string | null = null;

    const normalizedType = normalizeDocumentType(input.documentType);
    if (
      ['semester_completion', 'semester_record', 'program_completion', 'graduation', 'transcript'].includes(
        normalizedType,
      ) ||
      input.documentType === 'semester_record'
    ) {
      const summaries =
        (eligibility.summaries as Awaited<ReturnType<typeof loadPublishedSummaries>>) ??
        (input.semesterId
          ? await loadPublishedSummaries(institutionId, input.studentId, { semesterId: input.semesterId })
          : await loadPublishedSummaries(institutionId, input.studentId, {
              programId: input.programId,
              semesterId: input.semesterId,
            }));
      transcriptRows = await this.buildTranscriptRows(institutionId, summaries);

      if (input.semesterId) {
        const semesterGrade = await SemesterGradeModel.findOne({
          institutionId: oid(institutionId),
          studentId: oid(input.studentId),
          semesterId: oid(input.semesterId),
        }).exec();
        semesterGpa = semesterGrade?.semesterGpa ?? null;
      }
      const [cgpaRecord, standing] = await Promise.all([
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
      cgpa = cgpaRecord?.cgpa ?? null;
      academicStanding = standing?.standing ?? null;
    }

    const payloadBuild = buildCertificatePayload(
      input,
      party,
      eligibility as Record<string, unknown>,
      transcriptRows,
      { semesterGpa, cgpa, academicStanding },
    );

    const verificationCode = generateVerificationCode();
    const now = new Date();
    const template = input.templateId
      ? await certificateRepository.getTemplate(institutionId, input.templateId)
      : null;
    const certificateNumber = await allocateCertificateNumber(
      institutionId,
      (template?.numberPrefix as string | null | undefined) ?? null,
    );
    const verificationURL = buildVerificationUrl(getPublicBaseUrl(), verificationCode);
    const status = input.publish ? 'published' : 'issued';
    const title = defaultTitleForDocumentType(input.documentType);

    const certificate = await certificateRepository.createCertificate({
      institutionId: oid(institutionId),
      studentId: oid(input.studentId),
      certificateNumber,
      documentType: input.documentType,
      templateId: input.templateId ? oid(input.templateId) : null,
      courseId: input.courseId ? oid(input.courseId) : null,
      courseGradeId: payloadBuild.courseGradeId,
      activityId: input.activityId ? oid(input.activityId) : null,
      activityKind: payloadBuild.activityKind,
      semesterId: input.semesterId ? oid(input.semesterId) : null,
      programId: input.programId ? oid(input.programId) : null,
      verificationCode,
      verificationURL,
      status,
      revoked: false,
      title,
      version: 1,
      documentPayload: payloadBuild.documentPayload,
      gradebookReference: {
        courseGradeId: payloadBuild.courseGradeId,
        snapshotVersion: payloadBuild.snapshotVersion,
        semesterId: input.semesterId ? oid(input.semesterId) : null,
        programId: input.programId ? oid(input.programId) : null,
        standingRecordId: payloadBuild.standingRecordId,
        activityId: input.activityId ? oid(input.activityId) : null,
        activityKind: payloadBuild.activityKind,
      },
      issueDate: now,
      issuedAt: now,
      publishedAt: input.publish ? now : null,
      issuedBy: oid(actor.userId),
      downloadCount: 0,
    });

    if (template?.signatures?.length) {
      const templateSignatures = template.signatures as Array<{
        role: string;
        name: string;
        title: string;
        imageUrl?: string | null;
      }>;
      await certificateRepository.createSignatures(
        templateSignatures.map((sig) => ({
          institutionId: oid(institutionId),
          certificateId: certificate._id,
          role: sig.role,
          name: sig.name,
          title: sig.title,
          imageUrl: sig.imageUrl ?? null,
          signedAt: now,
        })),
      );
    }

    await certificateRepository.appendAudit({
      institutionId,
      studentId: input.studentId,
      certificateId: String(certificate._id),
      event: 'certificate.issued',
      actorId: actor.userId,
      details: { documentType: input.documentType, verificationCode, certificateNumber },
    });
    await eventBus.emit(
      EVENTS.CERTIFICATE_READY,
      { certificateId: String(certificate._id), userId: input.studentId },
      { actorId: actor.userId },
    );
    await eventBus.emit(
      EVENTS.CERTIFICATE_ISSUED,
      { certificateId: String(certificate._id), userId: input.studentId },
      { actorId: actor.userId },
    );
    await eventBus.emit(
      EVENTS.CERTIFICATE_GENERATED,
      { certificateId: String(certificate._id), userId: input.studentId },
      { actorId: actor.userId },
    );
    if (input.publish) {
      await certificateRepository.appendAudit({
        institutionId,
        studentId: input.studentId,
        certificateId: String(certificate._id),
        event: 'certificate.published',
        actorId: actor.userId,
      });
      await eventBus.emit(
        EVENTS.CERTIFICATE_PUBLISHED,
        { certificateId: String(certificate._id), userId: input.studentId },
        { actorId: actor.userId },
      );
    }

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
            courseId: input.courseId!,
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
    const eligibility = isTranscriptEligible(
      summaries.map((row) => ({ published: row.published, result: row.result ?? null })),
    );
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

    const verificationCode = generateVerificationCode();
    const now = new Date();
    const transcriptNumber = await allocateTranscriptNumber(institutionId);
    const verificationURL = buildVerificationUrl(getPublicBaseUrl(), verificationCode);
    const status = input.publish ? 'published' : 'issued';

    const transcript = await certificateRepository.createTranscript({
      institutionId: oid(institutionId),
      studentId: oid(input.studentId),
      transcriptNumber,
      transcriptType: input.transcriptType,
      programId: input.programId ? oid(input.programId) : null,
      semesterId: input.semesterId ? oid(input.semesterId) : null,
      courseId: input.courseId ? oid(input.courseId) : null,
      verificationCode,
      verificationURL,
      status,
      version: 1,
      semesterGpa: semesterGrade?.semesterGpa ?? null,
      cgpa: cgpaRecord?.cgpa ?? null,
      academicStanding: standing?.standing ?? null,
      remarks: input.remarks ?? null,
      courses,
      documentPayload,
      issuedAt: now,
      issuedBy: oid(actor.userId),
      downloadCount: 0,
    });

    await certificateRepository.appendAudit({
      institutionId,
      studentId: input.studentId,
      transcriptId: String(transcript._id),
      event: 'transcript.generated',
      actorId: actor.userId,
      details: { transcriptNumber, transcriptType: input.transcriptType },
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

  async verify(
    query: VerifyCertificateQuery,
    meta?: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<CertificateVerificationResult> {
    const code = normalizeVerificationCode(query.code);
    return this.verifyInternal(code, meta);
  }

  async verifyByCode(
    verificationCode: string,
    meta?: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<CertificateVerificationResult> {
    return this.verifyInternal(normalizeVerificationCode(verificationCode), meta);
  }

  async getPublicCertificate(certificateNumber: string) {
    const certificate = await certificateRepository.findCertificateByNumber(certificateNumber);
    if (!certificate) throw new NotFoundError('Certificate not found');

    const institution = await InstitutionModel.findById(certificate.institutionId)
      .select('name logo')
      .lean()
      .exec();
    const student = await StudentModel.findById(certificate.studentId)
      .select('fullName rollNumber')
      .lean()
      .exec();

    const valid =
      ACTIVE_CERTIFICATE_STATUSES.has(certificate.status) && certificate.revoked !== true;

    return {
      valid,
      certificateNumber: certificate.certificateNumber,
      status: certificate.status,
      documentType: certificate.documentType,
      title: certificate.title,
      institutionName: (institution?.name as string | undefined) ?? null,
      studentName: (student?.fullName as string | undefined) ?? null,
      studentRollNumber: (student?.rollNumber as string | undefined) ?? null,
      issuedAt: certificate.issuedAt?.toISOString() ?? null,
      verificationURL: certificate.verificationURL,
      verificationCode: certificate.verificationCode,
      revokedAt: certificate.revokedAt?.toISOString() ?? null,
    };
  }

  private async verifyInternal(
    code: string,
    meta?: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<CertificateVerificationResult> {
    const certificate = await certificateRepository.findCertificateByVerificationCode(code);
    if (certificate) {
      const institution = await InstitutionModel.findById(certificate.institutionId)
        .select('name')
        .lean()
        .exec();
      const student = await StudentModel.findById(certificate.studentId).select('fullName').lean().exec();
      const valid =
        ACTIVE_CERTIFICATE_STATUSES.has(certificate.status) && certificate.revoked !== true;

      await certificateRepository.logVerification({
        institutionId: certificate.institutionId,
        certificateId: certificate._id,
        verificationCode: code,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
        valid,
      });
      await certificateRepository.appendAudit({
        institutionId: String(certificate.institutionId),
        certificateId: String(certificate._id),
        event: 'verification.checked',
        details: { valid, verificationCode: code },
      });

      return {
        valid,
        status: certificate.status,
        documentType: certificate.documentType,
        certificateNumber: certificate.certificateNumber,
        institutionName: (institution?.name as string | undefined) ?? null,
        studentName: (student?.fullName as string | undefined) ?? null,
        title: certificate.title,
        issuedAt: certificate.issuedAt?.toISOString() ?? null,
        revokedAt: certificate.revokedAt?.toISOString() ?? null,
        verificationURL: certificate.verificationURL,
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
      const valid = ACTIVE_CERTIFICATE_STATUSES.has(transcript.status);

      await certificateRepository.logVerification({
        institutionId: transcript.institutionId,
        transcriptId: transcript._id,
        verificationCode: code,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
        valid,
      });

      return {
        valid,
        status: transcript.status,
        documentType: 'transcript',
        certificateNumber: transcript.transcriptNumber,
        institutionName: (institution?.name as string | undefined) ?? null,
        studentName: (student?.fullName as string | undefined) ?? null,
        title: 'Official Academic Transcript',
        issuedAt: transcript.issuedAt?.toISOString() ?? null,
        revokedAt: transcript.revokedAt?.toISOString() ?? null,
        verificationURL: transcript.verificationURL,
        message: valid ? 'Transcript is valid' : `Transcript is ${transcript.status}`,
      };
    }

    await certificateRepository.logVerification({
      institutionId: null,
      verificationCode: code,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null,
      valid: false,
    });

    return {
      valid: false,
      status: null,
      documentType: null,
      certificateNumber: null,
      institutionName: null,
      studentName: null,
      title: null,
      issuedAt: null,
      revokedAt: null,
      verificationURL: null,
      message: 'Verification code not found',
    };
  }

  async institutionDashboard(actor: ActorContext): Promise<CertificateDashboardStats> {
    if (!canManage(actor)) throw new ForbiddenError('Certificate manage access required');
    const institutionId = requireTenant(actor);
    const [counts, breakdown, pendingEligible] = await Promise.all([
      certificateRepository.countIssued(institutionId),
      certificateRepository.analyticsBreakdown(institutionId),
      CourseGradeSummaryModel.countDocuments({
        institutionId: oid(institutionId),
        published: true,
        result: 'pass',
      }).exec(),
    ]);

    return {
      issuedCount: counts.issued,
      publishedCount: counts.published,
      revokedCount: counts.revoked,
      pendingEligible,
      transcriptCount: counts.transcripts,
      downloadCount: counts.downloads,
      verificationRequests: counts.verifications,
      topPrograms: breakdown.topPrograms,
      topCourses: breakdown.topCourses,
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
      certificateCount: certificates.items.filter((row) =>
        ACTIVE_CERTIFICATE_STATUSES.has(row.status),
      ).length,
      transcriptCount: transcripts.filter((row) => ACTIVE_CERTIFICATE_STATUSES.has(row.status))
        .length,
      recentCertificates: certificates.items.slice(0, 5).map(toDto),
    };
  }

  async publishCertificate(input: PublishCertificateInput, actor: ActorContext) {
    if (!canManage(actor)) throw new ForbiddenError('Certificate manage access required');
    const institutionId = requireTenant(actor);
    const cert = await certificateRepository.publishCertificate(
      institutionId,
      input.certificateId,
      actor.userId,
    );
    if (!cert) throw new NotFoundError('Certificate not eligible for publish');

    await certificateRepository.appendAudit({
      institutionId,
      studentId: String(cert.studentId),
      certificateId: input.certificateId,
      event: 'certificate.published',
      actorId: actor.userId,
    });
    await eventBus.emit(EVENTS.CERTIFICATE_PUBLISHED, { certificateId: input.certificateId }, { actorId: actor.userId });
    return toDto(cert);
  }

  async archiveCertificate(certificateId: string, actor: ActorContext) {
    if (!canManage(actor)) throw new ForbiddenError('Certificate manage access required');
    const institutionId = requireTenant(actor);
    const cert = await certificateRepository.archiveCertificate(institutionId, certificateId);
    if (!cert) throw new NotFoundError('Certificate not found');

    await certificateRepository.appendAudit({
      institutionId,
      studentId: String(cert.studentId),
      certificateId,
      event: 'certificate.archived',
      actorId: actor.userId,
    });
    return toDto(cert);
  }

  async regenerateCertificate(certificateId: string, actor: ActorContext) {
    if (!canManage(actor)) throw new ForbiddenError('Certificate manage access required');
    const institutionId = requireTenant(actor);
    const existing = await certificateRepository.getCertificate(institutionId, certificateId);
    if (!existing) throw new NotFoundError('Certificate not found');
    if (!ACTIVE_CERTIFICATE_STATUSES.has(existing.status)) {
      throw new ValidationError('Only active certificates can be regenerated');
    }

    await certificateRepository.archiveCertificate(institutionId, certificateId);

    const input: IssueCertificateInput = {
      studentId: String(existing.studentId),
      documentType: existing.documentType,
      courseId: existing.courseId ? String(existing.courseId) : undefined,
      semesterId: existing.semesterId ? String(existing.semesterId) : undefined,
      programId: existing.programId ? String(existing.programId) : undefined,
      activityId: existing.activityId ? String(existing.activityId) : undefined,
      templateId: existing.templateId ? String(existing.templateId) : undefined,
      publish: existing.status === 'published',
    };

    const regenerated = await this.issueCertificate(input, actor);
    await AcademicCertificateModel.findByIdAndUpdate(String(regenerated.id), {
      version: (existing.version ?? 1) + 1,
      rootCertificateId: existing.rootCertificateId ?? existing._id,
    }).exec();

    await certificateRepository.appendAudit({
      institutionId,
      studentId: String(existing.studentId),
      certificateId: String(regenerated.id),
      event: 'certificate.regenerated',
      actorId: actor.userId,
      details: { previousCertificateId: certificateId },
    });

    return this.getCertificate(String(regenerated.id), actor);
  }

  async exportRegistry(query: RegistryExportQuery, actor: ActorContext) {
    if (!canManage(actor)) throw new ForbiddenError('Certificate manage access required');
    const institutionId = requireTenant(actor);
    const rows = await certificateRepository.listRegistryRows(institutionId, query.status);
    const csv = rowsToCsv(
      ['certificateNumber', 'studentId', 'documentType', 'status', 'issueDate', 'verificationCode'],
      rows.map((row) => ({
        certificateNumber: row.certificateNumber,
        studentId: String(row.studentId),
        documentType: row.documentType,
        status: row.status,
        issueDate: row.issueDate ? new Date(row.issueDate).toISOString() : '',
        verificationCode: row.verificationCode,
      })),
    );
    return { format: query.format, content: csv };
  }

  async downloadCertificateHtml(certificateId: string, actor: ActorContext) {
    const institutionId = requireTenant(actor);
    const cert = await certificateRepository.getCertificate(institutionId, certificateId);
    if (!cert) throw new NotFoundError('Certificate not found');
    if (actor.role === 'student') {
      const studentId = await resolveStudentScope(actor, institutionId);
      if (studentId !== String(cert.studentId)) throw new ForbiddenError('Access denied');
    }

    const institution = await InstitutionModel.findById(institutionId).select('name logo').lean().exec();
    const student = await StudentModel.findById(cert.studentId).select('fullName').lean().exec();
    const template = cert.templateId
      ? await certificateRepository.getTemplate(institutionId, String(cert.templateId))
      : null;
    const signatures = await certificateRepository.listSignatures(String(cert._id));

    const payload = cert.documentPayload as Record<string, unknown>;
    const grade = payload.grade as Record<string, unknown> | undefined;
    const bodyHtml = grade
      ? `<p>has successfully completed <strong>${(payload.course as Record<string, unknown>)?.title ?? 'the course'}</strong> with grade <strong>${grade.letterGrade ?? 'N/A'}</strong>.</p>`
      : `<p>has met the requirements for this academic document.</p>`;

    const html = renderCertificateHtml({
      title: cert.title,
      institutionName: (institution?.name as string) ?? 'Institution',
      studentName: (student?.fullName as string) ?? 'Student',
      bodyHtml,
      verificationCode: cert.verificationCode,
      verificationUrl: cert.verificationURL,
      certificateNumber: cert.certificateNumber,
      issuedAt: cert.issuedAt?.toISOString() ?? new Date().toISOString(),
      logoUrl: (template?.logoUrl as string | null) ?? (institution?.logo as string | null) ?? null,
      watermark: (template?.design as Record<string, unknown> | undefined)?.watermarkText as string | null,
      primaryColor: (template?.design as Record<string, unknown> | undefined)?.primaryColor as
        | string
        | null,
      signatures: signatures.map((sig) => ({
        name: sig.name,
        title: sig.title,
        role: sig.role,
      })),
    });

    await certificateRepository.incrementCertificateDownload(String(cert._id));
    return { html, contentType: 'text/html; charset=utf-8' };
  }

  async listEligibleStudents(
    actor: ActorContext,
    courseId?: string,
    documentType = 'course_completion',
  ) {
    if (!canWrite(actor)) throw new ForbiddenError('Certificate write access required');
    const institutionId = requireTenant(actor);
    if (!courseId) throw new ValidationError('courseId is required');

    const summaries = await CourseGradeSummaryModel.find({
      institutionId: oid(institutionId),
      courseId: oid(courseId),
      published: true,
      result: 'pass',
    }).exec();

    const eligible: Array<{ studentId: string; courseGradeId: string }> = [];
    for (const summary of summaries) {
      const active = await certificateRepository.findActiveCertificate({
        institutionId: oid(institutionId),
        studentId: summary.studentId,
        documentType,
        courseId: oid(courseId),
      });
      if (!active) {
        eligible.push({
          studentId: String(summary.studentId),
          courseGradeId: String(summary._id),
        });
      }
    }
    return { items: eligible, total: eligible.length };
  }

  async generateAcademicRecord(input: GenerateAcademicRecordInput, actor: ActorContext) {
    if (!canWrite(actor)) throw new ForbiddenError('Certificate write access required');
    const institutionId = requireTenant(actor);
    await resolveStudentScope(actor, institutionId, input.studentId);

    const summaries = await loadPublishedSummaries(institutionId, input.studentId, {
      semesterId: input.semesterId,
      programId: input.programId,
    });
    const eligibility = isTranscriptEligible(
      summaries.map((row) => ({ published: row.published, result: row.result ?? null })),
    );
    if (!eligibility.eligible) throw new ValidationError(eligibility.reasons.join('; '));

    const courses = await this.buildTranscriptRows(institutionId, summaries);
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

    const filter: Record<string, unknown> = {
      institutionId: oid(institutionId),
      studentId: oid(input.studentId),
    };
    if (input.programId) filter.programId = oid(input.programId);

    const existing = await certificateRepository.getAcademicRecord(
      institutionId,
      input.studentId,
      input.programId,
    );
    const nextVersion = (existing?.currentVersion ?? 0) + 1;

    const record = await certificateRepository.upsertAcademicRecord(filter, {
      programId: input.programId ? oid(input.programId) : null,
      semesterId: input.semesterId ? oid(input.semesterId) : null,
      currentVersion: nextVersion,
      semesterGpa: semesterGrade?.semesterGpa ?? null,
      cgpa: cgpaRecord?.cgpa ?? null,
      academicStanding: standing?.standing ?? null,
      remarks: input.remarks ?? null,
      courses,
    });

    const snapshot = {
      studentId: input.studentId,
      programId: input.programId ?? null,
      semesterId: input.semesterId ?? null,
      semesterGpa: semesterGrade?.semesterGpa ?? null,
      cgpa: cgpaRecord?.cgpa ?? null,
      academicStanding: standing?.standing ?? null,
      remarks: input.remarks ?? null,
      courses,
    };

    await certificateRepository.createAcademicRecordVersion({
      institutionId: oid(institutionId),
      academicRecordId: record!._id,
      version: nextVersion,
      snapshot,
      frozenAt: new Date(),
      frozenBy: oid(actor.userId),
      immutable: true,
    });

    await certificateRepository.appendAudit({
      institutionId,
      studentId: input.studentId,
      event: 'academic_record.generated',
      actorId: actor.userId,
      details: { version: nextVersion },
    });

    return toDto(record!);
  }

  async getAcademicRecord(actor: ActorContext, studentId?: string, programId?: string) {
    const institutionId = requireTenant(actor);
    const scopedStudent = await resolveStudentScope(actor, institutionId, studentId);
    if (!scopedStudent) throw new ValidationError('studentId is required');
    const record = await certificateRepository.getAcademicRecord(
      institutionId,
      scopedStudent,
      programId,
    );
    if (!record) throw new NotFoundError('Academic record not found');
    return toDto(record);
  }

  async bulkAction(input: BulkIssueCertificatesInput, actor: ActorContext) {
    const action = input.action ?? 'issue';
    if (action === 'issue' || action === 'generate') {
      if (input.documentType === 'course_completion' && input.courseId) {
        return this.bulkIssueCourseCertificates(input, actor);
      }
      throw new ValidationError('Bulk issue requires course_completion with courseId');
    }

    if (!canManage(actor)) throw new ForbiddenError('Certificate manage access required');
    const institutionId = requireTenant(actor);

    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (input.courseId) filter.courseId = oid(input.courseId);
    if (input.studentIds?.length) filter.studentId = { $in: input.studentIds.map(oid) };

    const certificates = await AcademicCertificateModel.find(filter).exec();
    const results: string[] = [];

    for (const cert of certificates) {
      if (action === 'publish' && ['issued', 'generated'].includes(cert.status)) {
        await this.publishCertificate({ certificateId: String(cert._id) }, actor);
        results.push(String(cert._id));
      } else if (action === 'archive') {
        await this.archiveCertificate(String(cert._id), actor);
        results.push(String(cert._id));
      } else if (action === 'revoke') {
        await this.revokeCertificate(
          { certificateId: String(cert._id), reason: 'Bulk revocation' },
          actor,
        );
        results.push(String(cert._id));
      }
    }

    return { action, processed: results.length, certificateIds: results };
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
      .select('title courseCode credits')
      .lean()
      .exec();
    const courseMap = new Map(courses.map((course) => [String(course._id), course]));

    return summaries.map((summary) => {
      const course = courseMap.get(String(summary.courseId));
      return {
        courseId: String(summary.courseId),
        courseCode: (course?.courseCode as string | undefined) ?? null,
        courseTitle: (course?.title as string | undefined) ?? 'Course',
        credits: (course?.credits as number | undefined) ?? 0,
        letterGrade: summary.letterGrade ?? null,
        gradePoints: summary.gradePoints ?? null,
        percentage: summary.percentage ?? null,
        result: summary.result ?? null,
        semesterId: summary.semesterId ? String(summary.semesterId) : null,
        publishedAt: summary.publishedAt?.toISOString() ?? null,
      };
    });
  }
}

export const certificateService = new CertificateService();
