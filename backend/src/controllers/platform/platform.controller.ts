import type { NextFunction, Request, Response } from 'express';
import type {
  ConfirmDemoRequestInput,
  CreateDemoRequestInput,
  DeclineDemoRequestInput,
  DemoRequestListQuery,
  InstitutionAdminLoginAuditQuery,
  PlatformMarketingInput,
  ProvisionCampusInput,
  ResendAdminCredentialsInput,
} from '@learnova/validation';
import { UnauthorizedError, ValidationError } from '../../utils/errors/index.js';
import { env } from '../../config/env.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import { demoRequestService } from '../../services/platform/demo-request.service.js';
import { platformMarketingService } from '../../services/platform/platform-marketing.service.js';
import { publicService } from '../../services/platform/public.service.js';
import { superAdminService } from '../../services/platform/super-admin.service.js';
import type { ActorContext } from '../../services/institution/institution.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function createDemoRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await demoRequestService.createPublic(req.body as CreateDemoRequestInput);
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listDemoRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await demoRequestService.list(
      req.query as unknown as DemoRequestListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listInstitutionAdminLogins(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await superAdminService.listInstitutionAdminLogins(
      req.query as unknown as InstitutionAdminLoginAuditQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function confirmDemoRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await demoRequestService.confirm(
      req.params.id as string,
      req.body as ConfirmDemoRequestInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function declineDemoRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await demoRequestService.decline(
      req.params.id as string,
      req.body as DeclineDemoRequestInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getPublicMarketing(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await platformMarketingService.getPublicMarketing();
    sendSuccess(res, data, { requestId: _req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateMarketing(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await platformMarketingService.updateMarketing(req.body as PlatformMarketingInput);
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function provisionCampus(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await superAdminService.provisionCampus(
      req.body as ProvisionCampusInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function resendAdminCredentials(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await superAdminService.resendAdminCredentials(
      req.params.id as string,
      req.body as ResendAdminCredentialsInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getPublicPortal(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = (req.query.slug as string | undefined)?.toLowerCase();
    if (!slug) {
      const defaultSlug = env.DEFAULT_INSTITUTION_SLUG;
      if (!defaultSlug) {
        next(new ValidationError('slug query parameter is required'));
        return;
      }
      const data = await publicService.getPortalBySlug(defaultSlug);
      sendSuccess(res, data, { requestId: req.requestId });
      return;
    }
    const data = await publicService.getPortalBySlug(slug);
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listPublicInstitutions(_req: Request, res: Response, next: NextFunction) {
  try {
    const items = await publicService.listActiveInstitutions();
    sendSuccess(res, { items }, { requestId: _req.requestId });
  } catch (err) {
    next(err);
  }
}
