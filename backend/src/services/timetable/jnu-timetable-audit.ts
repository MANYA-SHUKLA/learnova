import { Types } from 'mongoose';
import { SemesterModel, TimetableSlotModel } from '../../models/index.js';
import type { TimetableDayOfWeek } from '@learnova/types';
import { JNU_BTECH_PROGRESSION_SEMESTERS } from './jnu-master-instructions.js';
import { buildJnuSourceDatabase } from './jnu-timetable-source.js';
import {
  formatValidationReport,
  validateJnuTimetable,
  type JnuValidationReport,
} from './jnu-timetable-validator.js';

/** CHECK TIMETABLE — audit all B.Tech progression semesters for an institution. */
export async function auditJnuInstitutionTimetable(institutionId: string): Promise<JnuValidationReport> {
  const institutionOid = new Types.ObjectId(institutionId);
  const semesters = await SemesterModel.find({
    institutionId: institutionOid,
    number: { $in: [...JNU_BTECH_PROGRESSION_SEMESTERS] },
    deletedAt: null,
  })
    .select('_id')
    .lean()
    .exec();

  const slots = await TimetableSlotModel.find({
    institutionId: institutionOid,
    semesterId: { $in: semesters.map((row) => row._id) },
    status: 'active',
    deletedAt: null,
  })
    .select('dayOfWeek startTime endTime facultyId facultyName sectionId sectionName room courseTitle')
    .lean()
    .exec();

  return validateJnuTimetable(
    slots.map((row) => ({
      dayOfWeek: row.dayOfWeek as TimetableDayOfWeek,
      startTime: row.startTime as string,
      endTime: row.endTime as string,
      facultyId: String(row.facultyId),
      facultyName: row.facultyName as string,
      sectionId: String(row.sectionId),
      sectionName: row.sectionName as string,
      room: row.room as string,
      courseTitle: row.courseTitle as string,
    })),
    { uncertainties: buildJnuSourceDatabase().uncertainties },
  );
}

export async function formatJnuInstitutionAudit(institutionId: string): Promise<string> {
  const report = await auditJnuInstitutionTimetable(institutionId);
  return formatValidationReport(report);
}
