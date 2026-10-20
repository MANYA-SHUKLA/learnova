import { Router, type RequestHandler } from 'express';
import type { Permission } from '@learnova/types';
import type { ZodSchema } from 'zod';
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
  updatePortalSettingsSchema,
  updateInstitutionSchema,
  updateInstitutionSettingsSchema,
  updateProgramSchema,
  updateSchoolSchema,
  updateSectionSchema,
  updateSemesterSchema,
} from '@learnova/validation';
import { authenticate, requireAnyPermission, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/institution/institution.controller.js';
import type { ResourceControllers } from '../../controllers/institution/institution.controller.js';

function mountResource(
  router: Router,
  basePath: string,
  controllers: ResourceControllers,
  createSchema: ZodSchema<unknown>,
  updateSchema: ZodSchema<unknown>,
  readPermissions: Permission[] = [PERMISSIONS.INSTITUTION_READ],
) {
  const read = [
    authenticate({ required: true }),
    readPermissions.length > 1
      ? requireAnyPermission(...readPermissions)
      : requirePermission(...readPermissions),
  ] as RequestHandler[];
  const manage = [
    authenticate({ required: true }),
    requirePermission(PERMISSIONS.INSTITUTION_MANAGE),
  ] as RequestHandler[];

  router.get(basePath, ...read, validate(orgListQuerySchema, 'query'), (req, res, next) => {
    void controllers.list(req, res, next);
  });
  router.post(basePath, ...manage, validate(createSchema), (req, res, next) => {
    void controllers.create(req, res, next);
  });
  router.get(`${basePath}/:id`, ...read, validate(idParamsSchema, 'params'), (req, res, next) => {
    void controllers.get(req, res, next);
  });
  router.put(
    `${basePath}/:id`,
    ...manage,
    validate(idParamsSchema, 'params'),
    validate(updateSchema),
    (req, res, next) => {
      void controllers.update(req, res, next);
    },
  );
  router.patch(
    `${basePath}/:id`,
    ...manage,
    validate(idParamsSchema, 'params'),
    validate(updateSchema),
    (req, res, next) => {
      void controllers.update(req, res, next);
    },
  );
  router.delete(
    `${basePath}/:id`,
    ...manage,
    validate(idParamsSchema, 'params'),
    (req, res, next) => {
      void controllers.archive(req, res, next);
    },
  );
  router.post(
    `${basePath}/:id/restore`,
    ...manage,
    validate(idParamsSchema, 'params'),
    (req, res, next) => {
      void controllers.restore(req, res, next);
    },
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

/** Faculty/students need catalog lists (branch, year, batch) without full institution admin. */
const orgCatalogRead: Permission[] = [
  PERMISSIONS.INSTITUTION_READ,
  PERMISSIONS.ERP_READ,
  PERMISSIONS.COURSE_READ,
  PERMISSIONS.TIMETABLE_READ,
];

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
institutionRoutes.patch(
  '/institutions/:id/portal-settings',
  ...manageAuth,
  validate(idParamsSchema, 'params'),
  validate(updatePortalSettingsSchema),
  ctrl.updatePortalSettings,
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
  orgCatalogRead,
);
mountResource(
  institutionRoutes,
  '/schools',
  ctrl.schoolControllers,
  createSchoolSchema,
  updateSchoolSchema,
  orgCatalogRead,
);
mountResource(
  institutionRoutes,
  '/departments',
  ctrl.departmentControllers,
  createDepartmentSchema,
  updateDepartmentSchema,
  orgCatalogRead,
);
mountResource(
  institutionRoutes,
  '/programs',
  ctrl.programControllers,
  createProgramSchema,
  updateProgramSchema,
  orgCatalogRead,
);
mountResource(
  institutionRoutes,
  '/academic-years',
  ctrl.academicYearControllers,
  createAcademicYearSchema,
  updateAcademicYearSchema,
  orgCatalogRead,
);
mountResource(
  institutionRoutes,
  '/semesters',
  ctrl.semesterControllers,
  createSemesterSchema,
  updateSemesterSchema,
  [...orgCatalogRead, PERMISSIONS.COURSE_WRITE],
);
mountResource(
  institutionRoutes,
  '/sections',
  ctrl.sectionControllers,
  createSectionSchema,
  updateSectionSchema,
  orgCatalogRead,
);
mountResource(
  institutionRoutes,
  '/batches',
  ctrl.batchControllers,
  createBatchSchema,
  updateBatchSchema,
  orgCatalogRead,
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
