import { Types } from 'mongoose';
import { AcademicYearModel, SemesterModel } from '../../models/index.js';
import {
  semesterDateRange,
  termWindowsForDate,
} from '../../utils/timetable/academic-calendar.js';

/**
 * Marks the term that contains `now` as active and the other term as inactive.
 * Odd (July–December): Year 1 Sem 1, Year 2 Sem 3, Year 3 Sem 5, Year 4 Sem 7.
 * Even (January–May): Year 1 Sem 2, Year 2 Sem 4, Year 3 Sem 6, Year 4 Sem 8.
 */
export async function syncSemesterCalendar(
  institutionId: string,
  now: Date = new Date(),
): Promise<void> {
  const institutionOid = new Types.ObjectId(institutionId);
  const semesters = await SemesterModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    status: { $ne: 'archived' },
    term: { $in: ['odd', 'even'] },
  })
    .select('_id term academicYearId')
    .lean()
    .exec();
  if (semesters.length === 0) return;

  const { term, oddYear, evenYear } = termWindowsForDate(now);
  const odd = semesterDateRange(oddYear, 'odd');
  const even = semesterDateRange(evenYear, 'even');

  await SemesterModel.bulkWrite(
    semesters.map((semester) => {
      const current = semester.term === term;
      const range = semester.term === 'odd' ? odd : even;
      return {
        updateOne: {
          filter: { _id: semester._id },
          update: {
            $set: {
              status: current ? 'active' : 'inactive',
              startDate: range.startDate,
              endDate: range.endDate,
            },
          },
        },
      };
    }),
  );

  const yearId = semesters[0]?.academicYearId;
  if (!yearId) return;
  const name = `${oddYear}-${evenYear}`;
  try {
    await AcademicYearModel.updateOne(
      { _id: yearId, institutionId: institutionOid, deletedAt: null },
      {
        $set: {
          name,
          startDate: odd.startDate,
          endDate: even.endDate,
          isActive: true,
          status: 'active',
        },
      },
    );
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err;
    await AcademicYearModel.updateOne(
      { _id: yearId, institutionId: institutionOid, deletedAt: null },
      { $set: { startDate: odd.startDate, endDate: even.endDate, isActive: true, status: 'active' } },
    );
  }
}
