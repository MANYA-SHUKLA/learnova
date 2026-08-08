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
    if (query.programId) filter.programId = oid(query.programId);
    if (query.semesterId) filter.semesterId = oid(query.semesterId);
    if (query.documentType) filter.documentType = query.documentType;
    if (query.status) filter.status = query.status;
    if (query.q) {
      filter.$or = [
        { certificateNumber: new RegExp(query.q, 'i') },
        { title: new RegExp(query.q, 'i') },
        { verificationCode: query.q.toUpperCase() },
      ];
    }

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

  async findCertificateByNumber(certificateNumber: string) {
    return AcademicCertificateModel.findOne({
      certificateNumber: certificateNumber.trim(),
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
      {
        _id: oid(certificateId),
        institutionId: oid(institutionId),
        status: { $in: ['issued', 'published'] },
      },
      {
        $set: {
          status: 'revoked',
          revoked: true,
          revokedAt: now,
          revokedBy: oid(actorId),
          revocationReason: reason,
        },
      },
      { new: true },
    ).exec();
  },

  async publishCertificate(institutionId: string, certificateId: string, _actorId: string) {
    const now = new Date();
    return AcademicCertificateModel.findOneAndUpdate(
      {
        _id: oid(certificateId),
        institutionId: oid(institutionId),
        status: { $in: ['issued', 'generated'] },
      },
      { $set: { status: 'published', publishedAt: now } },
      { new: true },
    ).exec();
  },

  async archiveCertificate(institutionId: string, certificateId: string) {
    return AcademicCertificateModel.findOneAndUpdate(
      { _id: oid(certificateId), institutionId: oid(institutionId) },
      { $set: { status: 'archived', archivedAt: new Date() } },
      { new: true },
    ).exec();
  },

  async incrementCertificateDownload(certificateId: string) {
    return AcademicCertificateModel.findByIdAndUpdate(certificateId, {
      $inc: { downloadCount: 1 },
    }).exec();
  },

  async logVerification(payload: Record<string, unknown>) {
    const { CertificateVerificationLogModel } = await import(
      '../../models/certificate-verification-log.model.js'
    );
    return CertificateVerificationLogModel.create(payload);
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

  async listAuditLogs(
    institutionId: string,
    options?: { certificateId?: string; limit?: number },
  ) {
    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (options?.certificateId) filter.certificateId = oid(options.certificateId);
    return CertificateAuditLogModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(options?.limit ?? 50)
      .lean()
      .exec();
  },

  async listRegistryRows(
    institutionId: string,
    status?: string,
    limit = 5000,
  ) {
    const filter: Record<string, unknown> = { institutionId: oid(institutionId) };
    if (status) filter.status = status;
    return AcademicCertificateModel.find(filter)
      .sort({ issuedAt: -1 })
      .limit(limit)
      .select(
        'certificateNumber studentId documentType status issueDate verificationCode courseId programId',
      )
      .lean()
      .exec();
  },

  async findActiveCertificate(filter: Record<string, unknown>) {
    return AcademicCertificateModel.findOne({
      ...filter,
      status: { $in: ['issued', 'published'] },
    }).exec();
  },

  async createSignatures(rows: Array<Record<string, unknown>>) {
    if (rows.length === 0) return [];
    const { CertificateSignatureModel } = await import(
      '../../models/certificate-signature.model.js'
    );
    return CertificateSignatureModel.insertMany(rows);
  },

  async listSignatures(certificateId: string) {
    const { CertificateSignatureModel } = await import(
      '../../models/certificate-signature.model.js'
    );
    return CertificateSignatureModel.find({ certificateId: oid(certificateId) }).exec();
  },

  async createShare(payload: Record<string, unknown>) {
    const { CertificateShareModel } = await import('../../models/certificate-share.model.js');
    return CertificateShareModel.create(payload);
  },

  async upsertAcademicRecord(filter: Record<string, unknown>, payload: Record<string, unknown>) {
    const { AcademicRecordModel } = await import('../../models/academic-record.model.js');
    return AcademicRecordModel.findOneAndUpdate(filter, { $set: payload }, { upsert: true, new: true }).exec();
  },

  async getAcademicRecord(institutionId: string, studentId: string, programId?: string) {
    const { AcademicRecordModel } = await import('../../models/academic-record.model.js');
    const filter: Record<string, unknown> = {
      institutionId: oid(institutionId),
      studentId: oid(studentId),
    };
    if (programId) filter.programId = oid(programId);
    return AcademicRecordModel.findOne(filter).exec();
  },

  async createAcademicRecordVersion(payload: Record<string, unknown>) {
    const { AcademicRecordVersionModel } = await import(
      '../../models/academic-record-version.model.js'
    );
    return AcademicRecordVersionModel.create(payload);
  },

  async analyticsBreakdown(institutionId: string) {
    const instOid = oid(institutionId);
    const [topPrograms, topCourses] = await Promise.all([
      AcademicCertificateModel.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { institutionId: instOid, programId: { $ne: null }, status: { $in: ['issued', 'published'] } } },
        { $group: { _id: '$programId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]).exec(),
      AcademicCertificateModel.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { institutionId: instOid, courseId: { $ne: null }, status: { $in: ['issued', 'published'] } } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]).exec(),
    ]);
    return {
      topPrograms: topPrograms.map((row) => ({ programId: String(row._id), count: row.count })),
      topCourses: topCourses.map((row) => ({ courseId: String(row._id), count: row.count })),
    };
  },

  async countIssued(institutionId: string) {
    const [issued, published, revoked, transcripts, downloads, verifications] =
      await Promise.all([
      AcademicCertificateModel.countDocuments({
        institutionId: oid(institutionId),
        status: { $in: ['issued', 'published'] },
      }).exec(),
      AcademicCertificateModel.countDocuments({
        institutionId: oid(institutionId),
        status: 'published',
      }).exec(),
      AcademicCertificateModel.countDocuments({
        institutionId: oid(institutionId),
        status: 'revoked',
      }).exec(),
      AcademicTranscriptModel.countDocuments({
        institutionId: oid(institutionId),
        status: { $in: ['issued', 'published'] },
      }).exec(),
      AcademicCertificateModel.aggregate<{ total: number }>([
        { $match: { institutionId: oid(institutionId) } },
        { $group: { _id: null, total: { $sum: '$downloadCount' } } },
      ]).exec(),
      (async () => {
        const { CertificateVerificationLogModel } = await import(
          '../../models/certificate-verification-log.model.js'
        );
        return CertificateVerificationLogModel.countDocuments({
          institutionId: oid(institutionId),
        }).exec();
      })(),
    ]);
    return {
      issued,
      published,
      revoked,
      transcripts,
      downloads: downloads[0]?.total ?? 0,
      verifications,
    };
  },
};
