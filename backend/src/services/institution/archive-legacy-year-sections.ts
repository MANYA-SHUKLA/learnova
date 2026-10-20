import { Types } from 'mongoose';
import {
  EnrollmentModel,
  ProgramModel,
  SectionModel,
  SemesterModel,
  StudentModel,
  TimetableSlotModel,
} from '../../models/index.js';
import {
  canonicalSectionLabel,
  isLegacyYearSectionName,
} from '../../utils/timetable/section-labels.js';

/**
 * Removes duplicate "CSE/ECE Year N" sections in favour of Monsoon labels
 * (e.g. B.Tech ECE Sem VII). Idempotent — safe on every calendar sync.
 */
export async function archiveLegacyYearSections(institutionId: string): Promise<number> {
  const institutionOid = new Types.ObjectId(institutionId);

  const [sections, programs, semesters] = await Promise.all([
    SectionModel.find({
      institutionId: institutionOid,
      deletedAt: null,
      status: { $ne: 'archived' },
    })
      .select('_id name programId semesterId')
      .lean()
      .exec(),
    ProgramModel.find({ institutionId: institutionOid, deletedAt: null })
      .select('_id code')
      .lean()
      .exec(),
    SemesterModel.find({ institutionId: institutionOid, deletedAt: null })
      .select('_id number')
      .lean()
      .exec(),
  ]);

  const programCodeById = new Map(programs.map((p) => [String(p._id), p.code]));
  const semesterNumberById = new Map(semesters.map((s) => [String(s._id), s.number]));

  let archived = 0;
  for (const legacy of sections) {
    if (!isLegacyYearSectionName(legacy.name)) continue;

    const programCode = programCodeById.get(String(legacy.programId));
    const semesterNumber = semesterNumberById.get(String(legacy.semesterId));
    const canonicalName =
      programCode != null && semesterNumber != null
        ? canonicalSectionLabel(programCode, semesterNumber)
        : undefined;

    let target = canonicalName
      ? await SectionModel.findOne({
          institutionId: institutionOid,
          programId: legacy.programId,
          semesterId: legacy.semesterId,
          name: canonicalName,
          deletedAt: null,
          status: { $ne: 'archived' },
        })
          .select('_id')
          .lean()
          .exec()
      : null;

    if (!target) {
      target = await SectionModel.findOne({
        institutionId: institutionOid,
        programId: legacy.programId,
        semesterId: legacy.semesterId,
        deletedAt: null,
        status: { $ne: 'archived' },
        _id: { $ne: legacy._id },
        name: { $not: /^(CSE|ECE) Year \d+$|^Year \d+$/ },
      })
        .select('_id')
        .lean()
        .exec();
    }

    if (target) {
      const fromId = legacy._id;
      const toId = target._id;
      await Promise.all([
        StudentModel.updateMany(
          { institutionId: institutionOid, sectionId: fromId, deletedAt: null },
          { $set: { sectionId: toId } },
        ).exec(),
        EnrollmentModel.updateMany(
          { institutionId: institutionOid, sectionId: fromId, deletedAt: null },
          { $set: { sectionId: toId } },
        ).exec(),
        TimetableSlotModel.updateMany(
          { institutionId: institutionOid, sectionId: fromId, deletedAt: null },
          { $set: { sectionId: toId } },
        ).exec(),
      ]);
    }

    await SectionModel.updateOne(
      { _id: legacy._id, institutionId: institutionOid },
      { $set: { deletedAt: new Date(), status: 'archived' } },
    ).exec();
    archived += 1;
  }

  return archived;
}
