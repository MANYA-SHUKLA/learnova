import { Types } from 'mongoose';
import type { CertificateListQuery } from '@learnova/validation';
import { CertificateTemplateModel } from '../../models/certificate-template.model.js';
import { AcademicCertificateModel } from '../../models/academic-certificate.model.js';
import { AcademicTranscriptModel } from '../../models/academic-transcript.model.js';
import { CertificateAuditLogModel } from '../../models/certificate-audit-log.model.js';

export function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

export function pageMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function toDto(doc: {
  _id: Types.ObjectId;
  toObject?: () => Record<string, unknown>;
}): Record<string, unknown> {
  const raw =
    typeof doc.toObject === 'function'
      ? doc.toObject()
      : (doc as unknown as Record<string, unknown>);
  const { _id, __v, ...rest } = raw as Record<string, unknown> & {
    _id: Types.ObjectId;
    __v?: number;
  };

  const normalize = (value: unknown): unknown => {
    if (value instanceof Types.ObjectId) return String(value);
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k] = normalize(v);
      }
      return out;
    }
    return value;
  };

  return {
    id: String(_id),
    ...(normalize(rest) as Record<string, unknown>),
  };
}

export const certificateRepository = {
  async listTemplates(institutionId: string, documentType?: string) {
    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (documentType) filter.documentType = documentType;
    return CertificateTemplateModel.find(filter).sort({ updatedAt: -1 }).exec();
  },

  async upsertTemplate(institutionId: string, templateId: string | null, payload: Record<string, unknown>) {
    if (templateId) {
      return CertificateTemplateModel.findOneAndUpdate(
        { _id: oid(templateId), institutionId: oid(institutionId) },
        { $set: payload },
        { new: true },
      ).exec();
    }
    return CertificateTemplateModel.create({ institutionId: oid(institutionId), ...payload });
  },

  async getTemplate(institutionId: string, templateId: string) {
    return CertificateTemplateModel.findOne({
      _id: oid(templateId),
      institutionId: oid(institutionId),
    }).exec();
  },

  async listCertificates(institutionId: string, query: CertificateListQuery) {
    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (query.studentId) filter.studentId = oid(query.studentId);
    if (query.courseId) filter.courseId = oid(query.courseId);
    if (query.documentType) filter.documentType = query.documentType;
    if (query.status) filter.status = query.status;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AcademicCertificateModel.find(filter).sort({ issuedAt: -1 }).skip(skip).limit(limit).exec(),
      AcademicCertificateModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  },

  async getCertificate(institutionId: string, certificateId: string) {
    return AcademicCertificateModel.findOne({
      _id: oid(certificateId),
      institutionId: oid(institutionId),
    }).exec();
  },

  async findCertificateByVerificationCode(code: string) {
    return AcademicCertificateModel.findOne({ verificationCode: code.toUpperCase() }).exec();
  },

  async createCertificate(payload: Record<string, unknown>) {
    return AcademicCertificateModel.create(payload);
  },

  async revokeCertificate(
    institutionId: string,
    certificateId: string,
    actorId: string,
    reason: string,
  ) {
    const now = new Date();
    return AcademicCertificateModel.findOneAndUpdate(
      { _id: oid(certificateId), institutionId: oid(institutionId), status: 'issued' },
      {
        $set: {
          status: 'revoked',
          revokedAt: now,
          revokedBy: oid(actorId),
          revocationReason: reason,
        },
      },
      { new: true },
    ).exec();
  },

  async listTranscripts(institutionId: string, studentId?: string, semesterId?: string) {
    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (studentId) filter.studentId = oid(studentId);
    if (semesterId) filter.semesterId = oid(semesterId);
    return AcademicTranscriptModel.find(filter).sort({ issuedAt: -1 }).exec();
  },

  async getTranscript(institutionId: string, transcriptId: string) {
    return AcademicTranscriptModel.findOne({
      _id: oid(transcriptId),
      institutionId: oid(institutionId),
    }).exec();
  },

  async findTranscriptByVerificationCode(code: string) {
    return AcademicTranscriptModel.findOne({ verificationCode: code.toUpperCase() }).exec();
  },

  async createTranscript(payload: Record<string, unknown>) {
    return AcademicTranscriptModel.create(payload);
  },

  async revokeTranscript(
    institutionId: string,
    transcriptId: string,
    actorId: string,
    reason: string,
  ) {
    const now = new Date();
    return AcademicTranscriptModel.findOneAndUpdate(
      { _id: oid(transcriptId), institutionId: oid(institutionId), status: 'issued' },
      {
        $set: {
          status: 'revoked',
          revokedAt: now,
          revokedBy: oid(actorId),
          revocationReason: reason,
        },
      },
      { new: true },
    ).exec();
  },

  async appendAudit(payload: {
    institutionId: string;
    studentId?: string;
    certificateId?: string;
    transcriptId?: string;
    event: string;
    actorId?: string;
    details?: Record<string, unknown>;
  }) {
    return CertificateAuditLogModel.create({
      institutionId: oid(payload.institutionId),
      studentId: payload.studentId ? oid(payload.studentId) : null,
      certificateId: payload.certificateId ? oid(payload.certificateId) : null,
      transcriptId: payload.transcriptId ? oid(payload.transcriptId) : null,
      event: payload.event,
      actorId: payload.actorId ? oid(payload.actorId) : null,
      payload: payload.details ?? {},
    });
  },

  async countIssued(institutionId: string) {
    const [issued, revoked, transcripts] = await Promise.all([
      AcademicCertificateModel.countDocuments({
        institutionId: oid(institutionId),
        status: 'issued',
      }).exec(),
      AcademicCertificateModel.countDocuments({
        institutionId: oid(institutionId),
        status: 'revoked',
      }).exec(),
      AcademicTranscriptModel.countDocuments({
        institutionId: oid(institutionId),
        status: 'issued',
      }).exec(),
    ]);
    return { issued, revoked, transcripts };
  },
};
