import type { NextFunction, Request, Response } from 'express';
import type {
  CreateInstitutionInput,
  OrgListQuery,
  UpdateInstitutionInput,
  UpdateInstitutionSettingsInput,
} from '@learnova/validation';
import { UnauthorizedError } from '../../utils/errors/index.js';
import { sendCreated, sendSuccess } from '../../utils/response/index.js';
import {
  institutionService,
  type ActorContext,
} from '../../services/institution/institution.service.js';

function actorFrom(req: Request): ActorContext {
  if (!req.user) throw new UnauthorizedError();
  return {
    userId: req.user.sub,
    email: req.user.email,
    institutionId: req.user.institutionId,
    role: req.user.role,
  };
}

export async function createInstitution(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await institutionService.createInstitution(
      req.body as CreateInstitutionInput,
      actorFrom(req),
    );
    sendCreated(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function listInstitutions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await institutionService.listInstitutions(
      req.query as unknown as OrgListQuery,
      actorFrom(req),
    );
    sendSuccess(res, { items: result.items }, { meta: result.meta, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getMyInstitution(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await institutionService.getMyInstitution(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getInstitution(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await institutionService.getInstitution(req.params.id as string, actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateInstitution(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await institutionService.updateInstitution(
      req.params.id as string,
      req.body as UpdateInstitutionInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function archiveInstitution(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await institutionService.archiveInstitution(
      req.params.id as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function restoreInstitution(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await institutionService.restoreInstitution(
      req.params.id as string,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateBranding(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await institutionService.updateBranding(
      req.params.id as string,
      req.body as { logo?: string | null; favicon?: string | null },
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

type ListFn = (
  query: OrgListQuery,
  actor: ActorContext,
) => Promise<{ items: unknown[]; meta: unknown }>;
type GetFn = (id: string, actor: ActorContext) => Promise<unknown>;
type CreateFn = (body: unknown, actor: ActorContext) => Promise<unknown>;
type UpdateFn = (id: string, body: unknown, actor: ActorContext) => Promise<unknown>;
type IdFn = (id: string, actor: ActorContext) => Promise<unknown>;

export interface ResourceControllers {
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  get: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  archive: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  restore: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function makeResourceControllers(handlers: {
  list: ListFn;
  get: GetFn;
  create: CreateFn;
  update: UpdateFn;
  archive: IdFn;
  restore: IdFn;
}): ResourceControllers {
  return {
    list: async (req, res, next) => {
      try {
        const result = await handlers.list(
          req.query as unknown as OrgListQuery,
          actorFrom(req),
        );
        sendSuccess(res, { items: result.items }, {
          meta: result.meta as never,
          requestId: req.requestId,
        });
      } catch (err) {
        next(err);
      }
    },
    get: async (req, res, next) => {
      try {
        const data = await handlers.get(req.params.id as string, actorFrom(req));
        sendSuccess(res, data, { requestId: req.requestId });
      } catch (err) {
        next(err);
      }
    },
    create: async (req, res, next) => {
      try {
        const data = await handlers.create(req.body, actorFrom(req));
        sendCreated(res, data, { requestId: req.requestId });
      } catch (err) {
        next(err);
      }
    },
    update: async (req, res, next) => {
      try {
        const data = await handlers.update(req.params.id as string, req.body, actorFrom(req));
        sendSuccess(res, data, { requestId: req.requestId });
      } catch (err) {
        next(err);
      }
    },
    archive: async (req, res, next) => {
      try {
        const data = await handlers.archive(req.params.id as string, actorFrom(req));
        sendSuccess(res, data, { requestId: req.requestId });
      } catch (err) {
        next(err);
      }
    },
    restore: async (req, res, next) => {
      try {
        const data = await handlers.restore(req.params.id as string, actorFrom(req));
        sendSuccess(res, data, { requestId: req.requestId });
      } catch (err) {
        next(err);
      }
    },
  };
}

export const campusControllers = makeResourceControllers({
  list: (q, a) => institutionService.listCampuses(q, a),
  get: (id, a) => institutionService.getCampus(id, a),
  create: (b, a) => institutionService.createCampus(b as never, a),
  update: (id, b, a) => institutionService.updateCampus(id, b as never, a),
  archive: (id, a) => institutionService.archiveCampus(id, a),
  restore: (id, a) => institutionService.restoreCampus(id, a),
});

export const schoolControllers = makeResourceControllers({
  list: (q, a) => institutionService.listSchools(q, a),
  get: (id, a) => institutionService.getSchool(id, a),
  create: (b, a) => institutionService.createSchool(b as never, a),
  update: (id, b, a) => institutionService.updateSchool(id, b as never, a),
  archive: (id, a) => institutionService.archiveSchool(id, a),
  restore: (id, a) => institutionService.restoreSchool(id, a),
});

export const departmentControllers = makeResourceControllers({
  list: (q, a) => institutionService.listDepartments(q, a),
  get: (id, a) => institutionService.getDepartment(id, a),
  create: (b, a) => institutionService.createDepartment(b as never, a),
  update: (id, b, a) => institutionService.updateDepartment(id, b as never, a),
  archive: (id, a) => institutionService.archiveDepartment(id, a),
  restore: (id, a) => institutionService.restoreDepartment(id, a),
});

export const programControllers = makeResourceControllers({
  list: (q, a) => institutionService.listPrograms(q, a),
  get: (id, a) => institutionService.getProgram(id, a),
  create: (b, a) => institutionService.createProgram(b as never, a),
  update: (id, b, a) => institutionService.updateProgram(id, b as never, a),
  archive: (id, a) => institutionService.archiveProgram(id, a),
  restore: (id, a) => institutionService.restoreProgram(id, a),
});

export const academicYearControllers = makeResourceControllers({
  list: (q, a) => institutionService.listAcademicYears(q, a),
  get: (id, a) => institutionService.getAcademicYear(id, a),
  create: (b, a) => institutionService.createAcademicYear(b as never, a),
  update: (id, b, a) => institutionService.updateAcademicYear(id, b as never, a),
  archive: (id, a) => institutionService.archiveAcademicYear(id, a),
  restore: (id, a) => institutionService.restoreAcademicYear(id, a),
});

export const semesterControllers = makeResourceControllers({
  list: (q, a) => institutionService.listSemesters(q, a),
  get: (id, a) => institutionService.getSemester(id, a),
  create: (b, a) => institutionService.createSemester(b as never, a),
  update: (id, b, a) => institutionService.updateSemester(id, b as never, a),
  archive: (id, a) => institutionService.archiveSemester(id, a),
  restore: (id, a) => institutionService.restoreSemester(id, a),
});

export const sectionControllers = makeResourceControllers({
  list: (q, a) => institutionService.listSections(q, a),
  get: (id, a) => institutionService.getSection(id, a),
  create: (b, a) => institutionService.createSection(b as never, a),
  update: (id, b, a) => institutionService.updateSection(id, b as never, a),
  archive: (id, a) => institutionService.archiveSection(id, a),
  restore: (id, a) => institutionService.restoreSection(id, a),
});

export const batchControllers = makeResourceControllers({
  list: (q, a) => institutionService.listBatches(q, a),
  get: (id, a) => institutionService.getBatch(id, a),
  create: (b, a) => institutionService.createBatch(b as never, a),
  update: (id, b, a) => institutionService.updateBatch(id, b as never, a),
  archive: (id, a) => institutionService.archiveBatch(id, a),
  restore: (id, a) => institutionService.restoreBatch(id, a),
});

export const calendarControllers = makeResourceControllers({
  list: (q, a) => institutionService.listAcademicCalendars(q, a),
  get: (id, a) => institutionService.getAcademicCalendar(id, a),
  create: (b, a) => institutionService.createAcademicCalendar(b as never, a),
  update: (id, b, a) => institutionService.updateAcademicCalendar(id, b as never, a),
  archive: (id, a) => institutionService.archiveAcademicCalendar(id, a),
  restore: (id, a) => institutionService.restoreAcademicCalendar(id, a),
});

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await institutionService.getSettings(actorFrom(req));
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await institutionService.updateSettings(
      req.body as UpdateInstitutionSettingsInput,
      actorFrom(req),
    );
    sendSuccess(res, data, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
