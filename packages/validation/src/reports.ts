import { z } from 'zod';
import { REPORT_EXPORT_FORMATS, REPORT_SCOPES } from '@learnova/constants';
import { REGEX } from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');

export const reportsQuerySchema = z.object({
  departmentId: objectIdField.optional(),
  semesterId: objectIdField.optional(),
  courseId: objectIdField.optional(),
});

export const reportsExportQuerySchema = reportsQuerySchema.extend({
  scope: z.enum(REPORT_SCOPES),
  format: z.enum(REPORT_EXPORT_FORMATS).default('csv'),
});

export type ReportsQuery = z.infer<typeof reportsQuerySchema>;
export type ReportsExportQuery = z.infer<typeof reportsExportQuerySchema>;
