import { Router, type RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { PERMISSIONS } from '@learnova/constants';
import {
  createAcademicCalendarSchema,
  createAcademicYearSchema,
  createBatchSchema,
  createCampusSchema,
  createDepartmentSchema,
  createInstitutionSchema,
  createProgramSchema,
  createSchoolSchema,
  createSectionSchema,
  createSemesterSchema,
  idParamsSchema,
  orgListQuerySchema,
  updateAcademicCalendarSchema,
  updateAcademicYearSchema,
  updateBatchSchema,
  updateCampusSchema,
  updateDepartmentSchema,
  updateInstitutionBrandingSchema,
  updateInstitutionSchema,
  updateInstitutionSettingsSchema,
  updateProgramSchema,
  updateSchoolSchema,
  updateSectionSchema,
  updateSemesterSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/institution/institution.controller.js';

type ResourceControllers = ReturnType<typeof ctrl.makeResourceControllers>;

function mountResource(
  router: Router,
  basePath: string,
  controllers: ResourceControllers,
  createSchema: ZodTypeAny,
  updateSchema: ZodTypeAny,
) {
  const read = [
    authenticate({ required: true }),
    requirePermission(PERMISSIONS.INSTITUTION_READ),
  ] as RequestHandler[];
  const manage = [
    authenticate({ required: true }),
    requirePermission(PERMISSIONS.INSTITUTION_MANAGE),
  ] as RequestHandler[];

  router.get(basePath, ...read, validate(orgListQuerySchema, 'query'), controllers.list);
  router.post(basePath, ...manage, validate(createSchema), controllers.create);
  router.get(
    `${basePath}/:id`,
    ...read,
    validate(idParamsSchema, 'params'),
    controllers.get,
  );
  router.put(
    `${basePath}/:id`,
    ...manage,
    validate(idParamsSchema, 'params'),
    validate(updateSchema),
    controllers.update,
  );
  router.patch(
    `${basePath}/:id`,
    ...manage,
    validate(idParamsSchema, 'params'),
    validate(updateSchema),
    controllers.update,
  );
  router.delete(
    `${basePath}/:id`,
    ...manage,
    validate(idParamsSchema, 'params'),
    controllers.archive,
  );
  router.post(
    `${basePath}/:id/restore`,
    ...manage,
    validate(idParamsSchema, 'params'),
    controllers.restore,
  );
}

const institutionRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.INSTITUTION_READ),
] as RequestHandler[];
const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.INSTITUTION_MANAGE),
] as RequestHandler[];

institutionRoutes.get('/institutions/me', ...readAuth, ctrl.getMyInstitution);
institutionRoutes.get(
  '/institutions',
  ...readAuth,
  validate(orgListQuerySchema, 'query'),
  ctrl.listInstitutions,
);
institutionRoutes.post(
  '/institutions',
  ...manageAuth,
  validate(createInstitutionSchema),
  ctrl.createInstitution,
);
institutionRoutes.get(
  '/institutions/:id',
  ...readAuth,
  validate(idParamsSchema, 'params'),
  ctrl.getInstitution,
);
institutionRoutes.put(
  '/institutions/:id',
  ...manageAuth,
  validate(idParamsSchema, 'params'),
  validate(updateInstitutionSchema),
  ctrl.updateInstitution,
);
institutionRoutes.patch(
  '/institutions/:id',
  ...manageAuth,
  validate(idParamsSchema, 'params'),
  validate(updateInstitutionSchema),
  ctrl.updateInstitution,
);
institutionRoutes.patch(
  '/institutions/:id/branding',
  ...manageAuth,
  validate(idParamsSchema, 'params'),
  validate(updateInstitutionBrandingSchema),
  ctrl.updateBranding,
);
institutionRoutes.delete(
  '/institutions/:id',
  ...manageAuth,
  validate(idParamsSchema, 'params'),
  ctrl.archiveInstitution,
);
institutionRoutes.post(
  '/institutions/:id/restore',
  ...manageAuth,
  validate(idParamsSchema, 'params'),
  ctrl.restoreInstitution,
);

mountResource(
  institutionRoutes,
  '/campuses',
  ctrl.campusControllers,
  createCampusSchema,
  updateCampusSchema,
);
mountResource(
  institutionRoutes,
  '/schools',
  ctrl.schoolControllers,
  createSchoolSchema,
  updateSchoolSchema,
);
mountResource(
  institutionRoutes,
  '/departments',
  ctrl.departmentControllers,
  createDepartmentSchema,
  updateDepartmentSchema,
);
mountResource(
  institutionRoutes,
  '/programs',
  ctrl.programControllers,
  createProgramSchema,
  updateProgramSchema,
);
mountResource(
  institutionRoutes,
  '/academic-years',
  ctrl.academicYearControllers,
  createAcademicYearSchema,
  updateAcademicYearSchema,
);
mountResource(
  institutionRoutes,
  '/semesters',
  ctrl.semesterControllers,
  createSemesterSchema,
  updateSemesterSchema,
);
mountResource(
  institutionRoutes,
  '/sections',
  ctrl.sectionControllers,
  createSectionSchema,
  updateSectionSchema,
);
mountResource(
  institutionRoutes,
  '/batches',
  ctrl.batchControllers,
  createBatchSchema,
  updateBatchSchema,
);
mountResource(
  institutionRoutes,
  '/academic-calendars',
  ctrl.calendarControllers,
  createAcademicCalendarSchema,
  updateAcademicCalendarSchema,
);

institutionRoutes.get('/institution-settings', ...readAuth, ctrl.getSettings);
institutionRoutes.put(
  '/institution-settings',
  ...manageAuth,
  validate(updateInstitutionSettingsSchema),
  ctrl.updateSettings,
);
institutionRoutes.patch(
  '/institution-settings',
  ...manageAuth,
  validate(updateInstitutionSettingsSchema),
  ctrl.updateSettings,
);

export default institutionRoutes;
