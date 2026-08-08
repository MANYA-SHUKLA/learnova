import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  bulkIssueCertificatesSchema,
  certificateIdParamsSchema,
  certificateListQuerySchema,
  certificateNumberParamsSchema,
  eligibleStudentsQuerySchema,
  generateAcademicRecordSchema,
  issueCertificateSchema,
  issueTranscriptSchema,
  publishCertificateSchema,
  registryExportQuerySchema,
  revokeCertificateSchema,
  templateIdParamsSchema,
  upsertCertificateTemplateSchema,
  verificationCodeParamsSchema,
  verifyCertificateQuerySchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/certificate/certificate.controller.js';

const certificateRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.CERTIFICATE_READ),
] as RequestHandler[];

const writeAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.CERTIFICATE_WRITE),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.CERTIFICATE_MANAGE),
] as RequestHandler[];

certificateRoutes.get(
  '/verify/:verificationCode',
  validate(verificationCodeParamsSchema, 'params'),
  ctrl.verifyCertificateByCode,
);

certificateRoutes.get(
  '/certificate/:certificateNumber',
  validate(certificateNumberParamsSchema, 'params'),
  ctrl.getPublicCertificateByNumber,
);

certificateRoutes.get(
  '/certificates/verify',
  validate(verifyCertificateQuerySchema, 'query'),
  ctrl.verifyCertificate,
);

certificateRoutes.get('/certificates/templates', ...readAuth, ctrl.listTemplates);
certificateRoutes.post(
  '/certificates/templates',
  ...manageAuth,
  validate(upsertCertificateTemplateSchema),
  ctrl.createTemplate,
);
certificateRoutes.put(
  '/certificates/templates/:templateId',
  ...manageAuth,
  validate(templateIdParamsSchema, 'params'),
  validate(upsertCertificateTemplateSchema),
  ctrl.updateTemplate,
);

certificateRoutes.get(
  '/certificates',
  ...readAuth,
  validate(certificateListQuerySchema, 'query'),
  ctrl.listCertificates,
);
certificateRoutes.get(
  '/certificates/transcripts',
  ...readAuth,
  ctrl.listTranscripts,
);
certificateRoutes.get(
  '/certificates/eligible-students',
  ...writeAuth,
  validate(eligibleStudentsQuerySchema, 'query'),
  ctrl.listEligibleStudents,
);
certificateRoutes.get(
  '/certificates/registry/export',
  ...manageAuth,
  validate(registryExportQuerySchema, 'query'),
  ctrl.exportRegistry,
);

certificateRoutes.get('/certificates/dashboard/institution', ...manageAuth, ctrl.institutionDashboard);
certificateRoutes.get('/certificates/dashboard/student', ...readAuth, ctrl.studentDashboard);

certificateRoutes.get(
  '/certificates/academic-record',
  ...readAuth,
  ctrl.getAcademicRecord,
);
certificateRoutes.post(
  '/certificates/academic-record',
  ...writeAuth,
  validate(generateAcademicRecordSchema),
  ctrl.generateAcademicRecord,
);

certificateRoutes.post(
  '/certificates/issue',
  ...writeAuth,
  validate(issueCertificateSchema),
  ctrl.issueCertificate,
);
certificateRoutes.post(
  '/certificates/bulk-issue',
  ...writeAuth,
  validate(bulkIssueCertificatesSchema),
  ctrl.bulkIssueCertificates,
);
certificateRoutes.post(
  '/certificates/publish',
  ...manageAuth,
  validate(publishCertificateSchema),
  ctrl.publishCertificate,
);
certificateRoutes.post(
  '/certificates/revoke',
  ...manageAuth,
  validate(revokeCertificateSchema),
  ctrl.revokeCertificate,
);
certificateRoutes.post(
  '/certificates/transcripts',
  ...writeAuth,
  validate(issueTranscriptSchema),
  ctrl.issueTranscript,
);

certificateRoutes.get(
  '/certificates/:certificateId/download',
  ...readAuth,
  validate(certificateIdParamsSchema, 'params'),
  ctrl.downloadCertificate,
);
certificateRoutes.post(
  '/certificates/:certificateId/regenerate',
  ...manageAuth,
  validate(certificateIdParamsSchema, 'params'),
  ctrl.regenerateCertificate,
);
certificateRoutes.post(
  '/certificates/:certificateId/archive',
  ...manageAuth,
  validate(certificateIdParamsSchema, 'params'),
  ctrl.archiveCertificate,
);
certificateRoutes.get(
  '/certificates/:certificateId',
  ...readAuth,
  validate(certificateIdParamsSchema, 'params'),
  ctrl.getCertificate,
);

export default certificateRoutes;
