import { z } from 'zod';
import { PAGINATION, REGEX } from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');

export const timetableDayOfWeekSchema = z.enum([
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
]);

export const timetableStatusSchema = z.enum(['draft', 'published', 'archived']);

export const timetableSlotStatusSchema = z.enum(['active', 'cancelled']);

function normalizeTimeInput(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match?.[1] || !match[2]) return trimmed;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

const timeField = z
  .string()
  .trim()
  .transform(normalizeTimeInput)
  .pipe(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM (24-hour)'));

export const timetableListQuerySchema = z.object({
  semesterId: objectIdField.optional(),
  status: timetableStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
});

export const timetableSlotListQuerySchema = z.object({
  dayOfWeek: timetableDayOfWeekSchema.optional(),
  sectionId: objectIdField.optional(),
  facultyId: objectIdField.optional(),
  courseId: objectIdField.optional(),
  status: timetableSlotStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(500)
    .default(PAGINATION.MAX_LIMIT),
  sortBy: z.enum(['dayOfWeek', 'startTime', 'courseTitle', 'sectionName']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const createTimetableSchema = z.object({
  semesterId: objectIdField,
  academicYearId: objectIdField,
  name: z.string().trim().min(2).max(200),
});

export const createTimetableSlotSchema = z
  .object({
    dayOfWeek: timetableDayOfWeekSchema,
    startTime: timeField,
    endTime: timeField,
    courseId: objectIdField,
    sectionId: objectIdField,
    facultyId: objectIdField,
    room: z.string().trim().min(1).max(100),
    status: timetableSlotStatusSchema.default('active'),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

const timetableSlotFieldsSchema = z.object({
  dayOfWeek: timetableDayOfWeekSchema,
  startTime: timeField,
  endTime: timeField,
  courseId: objectIdField,
  sectionId: objectIdField,
  facultyId: objectIdField,
  room: z.string().trim().min(1).max(100),
  status: timetableSlotStatusSchema.optional(),
});

export const updateTimetableSlotSchema = timetableSlotFieldsSchema
  .partial()
  .refine(
    (v) => {
      if (v.startTime && v.endTime) return v.startTime < v.endTime;
      return true;
    },
    { message: 'End time must be after start time', path: ['endTime'] },
  );

export const timetableIdParamsSchema = z.object({
  id: objectIdField,
});

export const timetableSlotIdParamsSchema = z.object({
  id: objectIdField,
});

export type TimetableListQuery = z.infer<typeof timetableListQuerySchema>;
export type TimetableSlotListQuery = z.infer<typeof timetableSlotListQuerySchema>;
export type CreateTimetableInput = z.infer<typeof createTimetableSchema>;
export type CreateTimetableSlotInput = z.infer<typeof createTimetableSlotSchema>;
export type UpdateTimetableSlotInput = z.infer<typeof updateTimetableSlotSchema>;
