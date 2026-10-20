import { Types } from 'mongoose';
import { AcademicYearModel, SectionModel, SemesterModel } from '../../models/index.js';
import {
  semesterDateRange,
  termWindowsForDate,
} from '../../utils/timetable/academic-calendar.js';
import { archiveLegacyYearSections } from './archive-legacy-year-sections.js';
import { mergeJointTimetableSlots } from './merge-joint-timetable-slots.js';
import { pruneMinimalOrgStructure } from './prune-minimal-org-structure.js';

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

  await syncSectionTermStatus(term, institutionOid);
  await archiveLegacyYearSections(institutionId);
  await pruneMinimalOrgStructure(institutionId);
  await mergeJointTimetableSlots(institutionId);
}

/**
 * Class sections follow the same odd/even window as semesters (Jul–Dec odd, Jan–May even).
 * Archived sections are left unchanged; capacity is preserved on inactive rows.
 */
async function syncSectionTermStatus(
  currentTerm: 'odd' | 'even',
  institutionOid: Types.ObjectId,
): Promise<void> {
  const semesters = await SemesterModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    status: { $ne: 'archived' },
    term: { $in: ['odd', 'even'] },
  })
    .select('_id term')
    .lean()
    .exec();
  if (semesters.length === 0) return;

  const activeSemesterIds = semesters
    .filter((s) => s.term === currentTerm)
    .map((s) => s._id);
  const inactiveSemesterIds = semesters
    .filter((s) => s.term !== currentTerm)
    .map((s) => s._id);

  const baseFilter = {
    institutionId: institutionOid,
    deletedAt: null,
    status: { $ne: 'archived' as const },
  };

  if (activeSemesterIds.length > 0) {
    await SectionModel.updateMany(
      { ...baseFilter, semesterId: { $in: activeSemesterIds } },
      { $set: { status: 'active' } },
    ).exec();
  }
  if (inactiveSemesterIds.length > 0) {
    await SectionModel.updateMany(
      { ...baseFilter, semesterId: { $in: inactiveSemesterIds } },
      { $set: { status: 'inactive' } },
    ).exec();
  }
}
