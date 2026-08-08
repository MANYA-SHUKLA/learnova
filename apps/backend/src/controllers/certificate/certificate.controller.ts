import type { NextFunction, Request, Response } from 'express';
import type {
  BulkIssueCertificatesInput,
  CertificateListQuery,
  IssueCertificateInput,
  IssueTranscriptInput,
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
    const data = await certificateService.bulkIssueCourseCertificates(
      req.body as BulkIssueCertificatesInput,
      actorFrom(req),
    );
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

export async function verifyCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await certificateService.verify(req.query as unknown as VerifyCertificateQuery);
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
