import { z } from 'zod';
import { CERTIFICATE_DOCUMENT_TYPES } from '@learnova/constants';
import { objectIdSchema as objectIdField, paginationSchema } from './index.js';

export const certificateDocumentTypeSchema = z.enum(CERTIFICATE_DOCUMENT_TYPES);

export const certificateListQuerySchema = z.object({
  studentId: objectIdField.optional(),
  courseId: objectIdField.optional(),
  documentType: certificateDocumentTypeSchema.optional(),
  status: z.enum(['draft', 'issued', 'revoked', 'expired']).optional(),
  ...paginationSchema.shape,
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
  active: z.boolean().default(true),
});

export const issueCertificateSchema = z.object({
  studentId: objectIdField,
  documentType: certificateDocumentTypeSchema,
  courseId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
  programId: objectIdField.optional(),
  templateId: objectIdField.optional(),
});

export const bulkIssueCertificatesSchema = z.object({
  documentType: z.enum(['course_completion']),
  courseId: objectIdField,
  studentIds: z.array(objectIdField).optional(),
});

export const revokeCertificateSchema = z.object({
  certificateId: objectIdField,
  reason: z.string().trim().min(3).max(2000),
});

export const issueTranscriptSchema = z.object({
  studentId: objectIdField,
  semesterId: objectIdField.optional(),
  programId: objectIdField.optional(),
});

export const verifyCertificateQuerySchema = z.object({
  code: z.string().trim().min(8).max(64),
});

export const certificateIdParamsSchema = z.object({ certificateId: objectIdField });
export const templateIdParamsSchema = z.object({ templateId: objectIdField });
export const transcriptIdParamsSchema = z.object({ transcriptId: objectIdField });

export type CertificateListQuery = z.infer<typeof certificateListQuerySchema>;
export type UpsertCertificateTemplateInput = z.infer<typeof upsertCertificateTemplateSchema>;
export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;
export type BulkIssueCertificatesInput = z.infer<typeof bulkIssueCertificatesSchema>;
export type RevokeCertificateInput = z.infer<typeof revokeCertificateSchema>;
export type IssueTranscriptInput = z.infer<typeof issueTranscriptSchema>;
export type VerifyCertificateQuery = z.infer<typeof verifyCertificateQuerySchema>;
