import type { NextFunction, Request, Response } from 'express';
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
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import {
  certificateService,
  type ActorContext,
} from '../../services/certificate/certificate.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

function verifyMeta(req: Request) {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  };
}

export async function listTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await certificateService.listTemplates(
      actorFrom(req),
      req.query.documentType as string | undefined,
    );
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function createTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.upsertTemplate(
      null,
      req.body as UpsertCertificateTemplateInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.upsertTemplate(
      req.params.templateId as string,
      req.body as UpsertCertificateTemplateInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listCertificates(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await certificateService.listCertificates(
      req.query as unknown as CertificateListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.getCertificate(
      req.params.certificateId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function issueCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.issueCertificate(
      req.body as IssueCertificateInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function bulkIssueCertificates(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as BulkIssueCertificatesInput;
    const data =
      body.action && body.action !== 'issue'
        ? await certificateService.bulkAction(body, actorFrom(req))
        : await certificateService.bulkIssueCourseCertificates(body, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function revokeCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.revokeCertificate(
      req.body as RevokeCertificateInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function publishCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.publishCertificate(
      req.body as PublishCertificateInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.archiveCertificate(
      req.params.certificateId as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function regenerateCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.regenerateCertificate(
      req.params.certificateId as string,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function exportRegistry(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.exportRegistry(
      req.query as unknown as RegistryExportQuery,
      actorFrom(req),
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="certificate-registry.csv"');
    res.send(data.content);
  } catch (err) {
    next(err);
  }
}

export async function downloadCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.downloadCertificateHtml(
      req.params.certificateId as string,
      actorFrom(req),
    );
    res.setHeader('Content-Type', data.contentType);
    res.send(data.html);
  } catch (err) {
    next(err);
  }
}

export async function listEligibleStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.listEligibleStudents(
      actorFrom(req),
      req.query.courseId as string | undefined,
      (req.query.documentType as string | undefined) ?? 'course_completion',
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function verifyCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.verify(
      req.query as unknown as VerifyCertificateQuery,
      verifyMeta(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function verifyCertificateByCode(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.verifyByCode(
      req.params.verificationCode as string,
      verifyMeta(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getPublicCertificateByNumber(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.getPublicCertificate(
      req.params.certificateNumber as string,
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function issueTranscript(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.issueTranscript(
      req.body as IssueTranscriptInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listTranscripts(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await certificateService.listTranscripts(
      actorFrom(req),
      req.query.studentId as string | undefined,
      req.query.semesterId as string | undefined,
    );
    sendSuccess(res, { items }, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function generateAcademicRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.generateAcademicRecord(
      req.body as GenerateAcademicRecordInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getAcademicRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.getAcademicRecord(
      actorFrom(req),
      req.query.studentId as string | undefined,
      req.query.programId as string | undefined,
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function institutionDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.institutionDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function studentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.studentDashboard(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
