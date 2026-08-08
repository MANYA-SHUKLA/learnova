import { z } from 'zod';
import {
  CERTIFICATE_BULK_ACTIONS,
  CERTIFICATE_DOCUMENT_TYPES,
  CERTIFICATE_STATUSES,
  PAGINATION,
  REGEX,
  TRANSCRIPT_TYPES,
} from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');

export const certificateDocumentTypeSchema = z.enum(CERTIFICATE_DOCUMENT_TYPES);

export const certificateListQuerySchema = z.object({
  studentId: objectIdField.optional(),
  courseId: objectIdField.optional(),
  programId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
  documentType: certificateDocumentTypeSchema.optional(),
  status: z.enum(CERTIFICATE_STATUSES).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
});

export const upsertCertificateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  documentType: certificateDocumentTypeSchema,
  titleTemplate: z.string().trim().min(1).max(500).default('Certificate of Achievement'),
  bodyTemplate: z.string().trim().min(1).max(5000),
  footerTemplate: z.string().trim().max(2000).optional().nullable(),
  signatoryName: z.string().trim().max(200).optional().nullable(),
  signatoryTitle: z.string().trim().max(200).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  numberPrefix: z.string().trim().max(20).optional().nullable(),
  design: z
    .object({
      headerHtml: z.string().max(5000).optional().nullable(),
      footerHtml: z.string().max(5000).optional().nullable(),
      logoUrl: z.string().url().optional().nullable(),
      sealUrl: z.string().url().optional().nullable(),
      watermarkText: z.string().max(200).optional().nullable(),
      backgroundColor: z.string().max(32).optional().nullable(),
      primaryColor: z.string().max(32).optional().nullable(),
      fontFamily: z.string().max(100).optional().nullable(),
    })
    .optional(),
  signatures: z
    .array(
      z.object({
        role: z.enum(['institution', 'registrar', 'dean', 'faculty']),
        name: z.string().trim().min(1).max(200),
        title: z.string().trim().min(1).max(200),
        imageUrl: z.string().url().optional().nullable(),
      }),
    )
    .optional(),
  active: z.boolean().default(true),
});

export const issueCertificateSchema = z.object({
  studentId: objectIdField,
  documentType: certificateDocumentTypeSchema,
  courseId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
  programId: objectIdField.optional(),
  activityId: objectIdField.optional(),
  templateId: objectIdField.optional(),
  publish: z.boolean().default(false),
});

export const generateCertificateSchema = issueCertificateSchema.extend({
  status: z.enum(['draft', 'generated']).default('generated'),
});

export const bulkIssueCertificatesSchema = z.object({
  action: z.enum(CERTIFICATE_BULK_ACTIONS).default('issue'),
  documentType: certificateDocumentTypeSchema.default('course_completion'),
  courseId: objectIdField.optional(),
  programId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
  studentIds: z.array(objectIdField).optional(),
  publish: z.boolean().default(false),
});

export const revokeCertificateSchema = z.object({
  certificateId: objectIdField,
  reason: z.string().trim().min(3).max(2000),
});

export const publishCertificateSchema = z.object({
  certificateId: objectIdField,
});

export const archiveCertificateSchema = z.object({
  certificateId: objectIdField,
});

export const regenerateCertificateSchema = z.object({
  certificateId: objectIdField,
});

export const issueTranscriptSchema = z.object({
  studentId: objectIdField,
  semesterId: objectIdField.optional(),
  programId: objectIdField.optional(),
  courseId: objectIdField.optional(),
  transcriptType: z.enum(TRANSCRIPT_TYPES).default('official'),
  remarks: z.string().trim().max(2000).optional(),
  publish: z.boolean().default(true),
});

export const generateAcademicRecordSchema = z.object({
  studentId: objectIdField,
  programId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
  remarks: z.string().trim().max(2000).optional(),
});

export const verifyCertificateQuerySchema = z.object({
  code: z.string().trim().min(8).max(64),
});

export const verificationCodeParamsSchema = z.object({
  verificationCode: z.string().trim().min(8).max(64),
});

export const certificateNumberParamsSchema = z.object({
  certificateNumber: z.string().trim().min(8).max(64),
});

export const certificateIdParamsSchema = z.object({ certificateId: objectIdField });
export const templateIdParamsSchema = z.object({ templateId: objectIdField });
export const transcriptIdParamsSchema = z.object({ transcriptId: objectIdField });

export const eligibleStudentsQuerySchema = z.object({
  courseId: objectIdField.optional(),
  documentType: certificateDocumentTypeSchema.default('course_completion'),
});

export const registryExportQuerySchema = z.object({
  format: z.enum(['csv']).default('csv'),
  status: z.enum(CERTIFICATE_STATUSES).optional(),
});

export type CertificateListQuery = z.infer<typeof certificateListQuerySchema>;
export type UpsertCertificateTemplateInput = z.infer<typeof upsertCertificateTemplateSchema>;
export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;
export type GenerateCertificateInput = z.infer<typeof generateCertificateSchema>;
export type BulkIssueCertificatesInput = z.infer<typeof bulkIssueCertificatesSchema>;
export type RevokeCertificateInput = z.infer<typeof revokeCertificateSchema>;
export type PublishCertificateInput = z.infer<typeof publishCertificateSchema>;
export type IssueTranscriptInput = z.infer<typeof issueTranscriptSchema>;
export type GenerateAcademicRecordInput = z.infer<typeof generateAcademicRecordSchema>;
export type VerifyCertificateQuery = z.infer<typeof verifyCertificateQuerySchema>;
export type RegistryExportQuery = z.infer<typeof registryExportQuerySchema>;
