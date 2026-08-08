import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  bulkIssueCertificatesSchema,
  certificateIdParamsSchema,
  certificateListQuerySchema,
  issueCertificateSchema,
  issueTranscriptSchema,
  revokeCertificateSchema,
  templateIdParamsSchema,
  upsertCertificateTemplateSchema,
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

certificateRoutes.get('/certificates/dashboard/institution', ...manageAuth, ctrl.institutionDashboard);
certificateRoutes.get('/certificates/dashboard/student', ...readAuth, ctrl.studentDashboard);

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
  '/certificates/:certificateId',
  ...readAuth,
  validate(certificateIdParamsSchema, 'params'),
  ctrl.getCertificate,
);

export default certificateRoutes;
