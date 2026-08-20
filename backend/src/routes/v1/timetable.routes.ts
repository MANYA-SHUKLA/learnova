import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '@learnova/constants';
import {
  createTimetableSchema,
  createTimetableSlotSchema,
  timetableIdParamsSchema,
  timetableListQuerySchema,
  timetableSlotIdParamsSchema,
  timetableSlotListQuerySchema,
  updateTimetableSlotSchema,
} from '@learnova/validation';
import { authenticate, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/timetable/timetable.controller.js';

const timetableRoutes = Router();

const readAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.TIMETABLE_READ),
] as RequestHandler[];

const manageAuth = [
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.TIMETABLE_MANAGE),
] as RequestHandler[];

timetableRoutes.get(
  '/timetables/today',
  ...readAuth,
  ctrl.todayClasses,
);

timetableRoutes.get(
  '/timetables',
  ...readAuth,
  validate(timetableListQuerySchema, 'query'),
  ctrl.listTimetables,
);

timetableRoutes.post(
  '/timetables',
  ...manageAuth,
  validate(createTimetableSchema),
  ctrl.createTimetable,
);

timetableRoutes.patch(
  '/timetables/:id/publish',
  ...manageAuth,
  validate(timetableIdParamsSchema, 'params'),
  ctrl.publishTimetable,
);

timetableRoutes.get(
  '/timetables/:id/slots',
  ...readAuth,
  validate(timetableIdParamsSchema, 'params'),
  validate(timetableSlotListQuerySchema, 'query'),
  ctrl.listTimetableSlots,
);

timetableRoutes.post(
  '/timetables/:id/slots',
  ...manageAuth,
  validate(timetableIdParamsSchema, 'params'),
  validate(createTimetableSlotSchema),
  ctrl.createTimetableSlot,
);

timetableRoutes.patch(
  '/timetable-slots/:id',
  ...manageAuth,
  validate(timetableSlotIdParamsSchema, 'params'),
  validate(updateTimetableSlotSchema),
  ctrl.updateTimetableSlot,
);

timetableRoutes.delete(
  '/timetable-slots/:id',
  ...manageAuth,
  validate(timetableSlotIdParamsSchema, 'params'),
  ctrl.deleteTimetableSlot,
);

export default timetableRoutes;
