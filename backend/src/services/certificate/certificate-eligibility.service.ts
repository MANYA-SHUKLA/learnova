/**
 * Certificate Eligibility Service
 *
 * Orchestrates eligibility checks before document issuance. This layer loads data from
 * gradebook and enrollment models, then delegates all rules to `@learnova/shared` pure
 * eligibility functions.
 *
 * Allowed inputs:
 * - Published `CourseGradeSummary` and `GradebookEntry` rows
 * - `AcademicStanding` (computed by gradebook from institution policy)
 * - Enrollment counts (completion coverage)
 * - Course flags (`certificateEnabled`)
 *
 * Forbidden in this module:
 * - evaluatePassFail, computeGpaWithFormula, computeAcademicStanding, letterGradeFromPercentage, etc.
 * - Any aggregation that derives marks or GPA from raw assessment data
 */

import type { CertificateDocumentType } from '@learnova/types';
import {
  activityKindForDocumentType,
  isActivityCompletionEligible,
  isCourseCompletionEligible,
  isCustomCertificateEligible,
  isGraduationCertificateEligible,
  isMeritCertificateEligible,
  isParticipationEligible,
  isProgramCompletionEligible,
  isSemesterRecordEligible,
  isTranscriptEligible,
  normalizeDocumentType,
} from '@learnova/shared';
import { CourseGradeSummaryModel } from '../../models/course-grade-summary.model.js';
import { GradebookEntryModel } from '../../models/gradebook-entry.model.js';
import { AcademicStandingModel } from '../../models/academic-standing.model.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { CourseModel } from '../../models/course.model.js';
import { ValidationError } from '../../utils/errors/index.js';
import { oid } from '../../repositories/certificate/certificate.repository.js';

function toPublishedGrade(row: {
  published: boolean;
  result?: string | null;
}): { published: boolean; result: string | null } {
  return { published: row.published, result: row.result ?? null };
}

export interface EligibilityContext {
  institutionId: string;
  studentId: string;
  documentType: CertificateDocumentType;
  courseId?: string;
  semesterId?: string;
  programId?: string;
  activityId?: string;
}

export async function assertCertificateEligible(ctx: EligibilityContext) {
  const type = normalizeDocumentType(ctx.documentType);

  if (type === 'course_completion') {
    if (!ctx.courseId) throw new ValidationError('courseId is required');
    const summary = await CourseGradeSummaryModel.findOne({
      institutionId: oid(ctx.institutionId),
      courseId: oid(ctx.courseId),
      studentId: oid(ctx.studentId),
      published: true,
    }).exec();
    if (!summary) throw new ValidationError('Published course grade not found');
    const course = await CourseModel.findById(ctx.courseId).select('certificateEnabled').lean().exec();
    const result = isCourseCompletionEligible(
      toPublishedGrade(summary),
      course?.certificateEnabled !== false,
    );
    if (!result.eligible) throw new ValidationError(result.reasons.join('; '));
    return { summary, snapshotVersion: summary.snapshotVersion ?? null };
  }

  const activityKind = activityKindForDocumentType(type);
  if (activityKind && ctx.courseId) {
    const summary = await CourseGradeSummaryModel.findOne({
      institutionId: oid(ctx.institutionId),
      courseId: oid(ctx.courseId),
      studentId: oid(ctx.studentId),
      published: true,
    }).exec();
    if (!summary) throw new ValidationError('Published course grade summary not found');
    const entries = await GradebookEntryModel.find({
      institutionId: oid(ctx.institutionId),
      courseId: oid(ctx.courseId),
      studentId: oid(ctx.studentId),
      activityKind,
      status: { $ne: 'superseded' },
    }).exec();
    const result = isActivityCompletionEligible(
      toPublishedGrade(summary),
      entries.map((e) => ({
        activityKind: e.activityKind,
        activityId: String(e.activityId),
        passed: e.passed,
        status: e.status,
      })),
      activityKind,
      ctx.activityId,
    );
    if (!result.eligible) throw new ValidationError(result.reasons.join('; '));
    return { summary, snapshotVersion: summary.snapshotVersion ?? null, activityKind };
  }

  if (type === 'semester_completion' || type === 'semester_record') {
    if (!ctx.semesterId) throw new ValidationError('semesterId is required');
    const summaries = await CourseGradeSummaryModel.find({
      institutionId: oid(ctx.institutionId),
      studentId: oid(ctx.studentId),
      semesterId: oid(ctx.semesterId),
      published: true,
    }).exec();
    const enrollmentCount = await EnrollmentModel.countDocuments({
      institutionId: oid(ctx.institutionId),
      studentId: oid(ctx.studentId),
      semesterId: oid(ctx.semesterId),
      deletedAt: null,
    }).exec();
    const result = isSemesterRecordEligible(summaries.map(toPublishedGrade), enrollmentCount);
    if (!result.eligible) throw new ValidationError(result.reasons.join('; '));
    return { summaries };
  }

  if (type === 'program_completion' || type === 'graduation') {
    const filter: Record<string, unknown> = {
      institutionId: oid(ctx.institutionId),
      studentId: oid(ctx.studentId),
      published: true,
    };
    if (ctx.programId) filter.programId = oid(ctx.programId);
    const summaries = await CourseGradeSummaryModel.find(filter).exec();
    const enrollmentCount = await EnrollmentModel.countDocuments({
      institutionId: oid(ctx.institutionId),
      studentId: oid(ctx.studentId),
      ...(ctx.programId ? { programId: oid(ctx.programId) } : {}),
      deletedAt: null,
    }).exec();
    const result = isProgramCompletionEligible(summaries.map(toPublishedGrade), Math.max(1, enrollmentCount));
    if (!result.eligible) throw new ValidationError(result.reasons.join('; '));
    if (type === 'graduation') {
      const standing = await AcademicStandingModel.findOne({
        institutionId: oid(ctx.institutionId),
        studentId: oid(ctx.studentId),
      }).exec();
      const graduation = isGraduationCertificateEligible(standing);
      if (!graduation.eligible) throw new ValidationError(graduation.reasons.join('; '));
    }
    return { summaries };
  }

  if (type === 'merit' || ctx.documentType === 'honors' || ctx.documentType === 'distinction') {
    const standing = await AcademicStandingModel.findOne({
      institutionId: oid(ctx.institutionId),
      studentId: oid(ctx.studentId),
      ...(ctx.semesterId ? { semesterId: oid(ctx.semesterId) } : {}),
    }).exec();
    const result = isMeritCertificateEligible(standing);
    if (!result.eligible) throw new ValidationError(result.reasons.join('; '));
    return { standing };
  }

  if (type === 'participation') {
    if (!ctx.courseId) throw new ValidationError('courseId is required for participation certificates');
    const summary = await CourseGradeSummaryModel.findOne({
      institutionId: oid(ctx.institutionId),
      courseId: oid(ctx.courseId),
      studentId: oid(ctx.studentId),
      published: true,
    }).exec();
    if (!summary) throw new ValidationError('Published course grade not found');
    const result = isParticipationEligible(toPublishedGrade(summary));
    if (!result.eligible) throw new ValidationError(result.reasons.join('; '));
    return { summary, snapshotVersion: summary.snapshotVersion ?? null };
  }

  if (type === 'custom') {
    const summary = ctx.courseId
      ? await CourseGradeSummaryModel.findOne({
          institutionId: oid(ctx.institutionId),
          courseId: oid(ctx.courseId),
          studentId: oid(ctx.studentId),
          published: true,
        }).exec()
      : await CourseGradeSummaryModel.findOne({
          institutionId: oid(ctx.institutionId),
          studentId: oid(ctx.studentId),
          published: true,
        }).exec();
    const result = isCustomCertificateEligible(
      summary ? toPublishedGrade(summary) : null,
    );
    if (!result.eligible) throw new ValidationError(result.reasons.join('; '));
    return { summary };
  }

  if (type === 'transcript') {
    const summaries = await CourseGradeSummaryModel.find({
      institutionId: oid(ctx.institutionId),
      studentId: oid(ctx.studentId),
      published: true,
      ...(ctx.semesterId ? { semesterId: oid(ctx.semesterId) } : {}),
    }).exec();
    const result = isTranscriptEligible(summaries.map(toPublishedGrade));
    if (!result.eligible) throw new ValidationError(result.reasons.join('; '));
    return { summaries };
  }

  throw new ValidationError(`Unsupported document type: ${ctx.documentType}`);
}
