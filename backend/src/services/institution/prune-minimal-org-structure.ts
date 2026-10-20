import { Types } from 'mongoose';
import {
  BatchModel,
  DepartmentModel,
  EnrollmentModel,
  FacultyModel,
  ProgramModel,
  SectionModel,
  StudentModel,
  TimetableSlotModel,
} from '../../models/index.js';
import { SOE_EXCLUDED_DEGREE_DEPARTMENT_CODES } from './soe-org-filters.js';
import { pruneSoeLearningCatalog } from './prune-soe-enrollments.js';

/** Demo / stack seed clutter — not used in SOE JNU minimal setup. */
const DEMO_SECTION_NAME = /^Section [A-Z]$/;
const DEMO_BATCH_NAME = /^Batch 20\d{2}-[A-Z]$/;

async function softArchiveSection(institutionOid: Types.ObjectId, id: Types.ObjectId) {
  await SectionModel.updateOne(
    { _id: id, institutionId: institutionOid },
    { $set: { deletedAt: new Date(), status: 'archived' } },
  ).exec();
}

async function softArchiveBatch(institutionOid: Types.ObjectId, id: Types.ObjectId) {
  await BatchModel.updateOne(
    { _id: id, institutionId: institutionOid },
    { $set: { deletedAt: new Date(), status: 'archived' } },
  ).exec();
}

async function sectionIsUnused(
  institutionOid: Types.ObjectId,
  sectionId: Types.ObjectId,
): Promise<boolean> {
  const [students, enrollments] = await Promise.all([
    StudentModel.countDocuments({
      institutionId: institutionOid,
      sectionId,
      deletedAt: null,
    }).exec(),
    EnrollmentModel.countDocuments({
      institutionId: institutionOid,
      sectionId,
      deletedAt: null,
    }).exec(),
  ]);
  return students === 0 && enrollments === 0;
}

async function softArchiveProgram(institutionOid: Types.ObjectId, id: Types.ObjectId) {
  await ProgramModel.updateOne(
    { _id: id, institutionId: institutionOid },
    { $set: { deletedAt: new Date(), status: 'archived' } },
  ).exec();
}

/** M.Tech / Ph.D — SOE JNU uses B.Tech CSE & ECE only for now. */
const optionalProgramQuery = () => ({
  $or: [
    { code: /^MT-/i },
    { code: /^PHD$/i },
    { level: 'doctoral' as const },
    { level: 'postgraduate' as const },
  ],
});

/** Degree-type rows on the “Degree programs” page — not used while B.Tech-only. */
const EXCLUDED_DEGREE_DEPARTMENT_FILTER = {
  code: { $in: [...SOE_EXCLUDED_DEGREE_DEPARTMENT_CODES] },
};

const POSTGRAD_SLOT_SECTION_NAME = /^(M\.Tech|Ph\.D)\b/i;

async function softArchiveDepartment(institutionOid: Types.ObjectId, id: Types.ObjectId) {
  await DepartmentModel.updateOne(
    { _id: id, institutionId: institutionOid },
    { $set: { deletedAt: new Date(), status: 'archived' } },
  ).exec();
}

async function archiveExcludedDegreeDepartments(institutionOid: Types.ObjectId): Promise<void> {
  const cseDept = await DepartmentModel.findOne({
    institutionId: institutionOid,
    code: 'CSE',
    deletedAt: null,
  })
    .select('_id')
    .lean()
    .exec();

  const excludedDepartments = await DepartmentModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    ...EXCLUDED_DEGREE_DEPARTMENT_FILTER,
  })
    .select('_id code')
    .lean()
    .exec();

  for (const dept of excludedDepartments) {
    if (cseDept && dept.code?.toUpperCase() === 'MATH') {
      await FacultyModel.updateMany(
        { institutionId: institutionOid, departmentId: dept._id, deletedAt: null },
        { $set: { departmentId: cseDept._id } },
      ).exec();
    }
    const programs = await ProgramModel.find({
      institutionId: institutionOid,
      departmentId: dept._id,
      deletedAt: null,
    })
      .select('_id')
      .lean()
      .exec();

    for (const program of programs) {
      const studentsOnProgram = await StudentModel.countDocuments({
        institutionId: institutionOid,
        programId: program._id,
        deletedAt: null,
      }).exec();
      if (studentsOnProgram === 0) {
        await softArchiveProgram(institutionOid, program._id);
      }
    }

    const studentsOnDept = await StudentModel.countDocuments({
      institutionId: institutionOid,
      programId: { $in: programs.map((p) => p._id) },
      deletedAt: null,
    }).exec();

    if (studentsOnDept === 0) {
      await softArchiveDepartment(institutionOid, dept._id);
    }
  }
}

async function removePostgraduateTimetableSlots(institutionOid: Types.ObjectId) {
  await TimetableSlotModel.updateMany(
    {
      institutionId: institutionOid,
      deletedAt: null,
      sectionName: POSTGRAD_SLOT_SECTION_NAME,
    },
    { $set: { deletedAt: new Date(), status: 'inactive' } },
  ).exec();
}

/**
 * Keeps org structure lean: archive M.Tech/Ph.D, demo sections, and empty demo batches.
 * Safe to run on every calendar sync (idempotent).
 */
export async function pruneMinimalOrgStructure(institutionId: string): Promise<void> {
  const institutionOid = new Types.ObjectId(institutionId);

  await archiveExcludedDegreeDepartments(institutionOid);

  const optionalPrograms = await ProgramModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    ...optionalProgramQuery(),
  })
    .select('_id code status')
    .lean()
    .exec();

  const optionalProgramIds = optionalPrograms.map((p) => p._id);

  if (optionalProgramIds.length > 0) {
    const optionalSections = await SectionModel.find({
      institutionId: institutionOid,
      programId: { $in: optionalProgramIds },
      deletedAt: null,
    })
      .select('_id')
      .lean()
      .exec();
    const optionalSectionIds = optionalSections.map((s) => s._id);

    await SectionModel.updateMany(
      {
        institutionId: institutionOid,
        programId: { $in: optionalProgramIds },
        deletedAt: null,
        status: { $ne: 'archived' },
      },
      { $set: { deletedAt: new Date(), status: 'archived' } },
    ).exec();

    if (optionalSectionIds.length > 0) {
      await TimetableSlotModel.updateMany(
        {
          institutionId: institutionOid,
          sectionId: { $in: optionalSectionIds },
          deletedAt: null,
        },
        { $set: { deletedAt: new Date(), status: 'inactive' } },
      ).exec();
    }

    await BatchModel.updateMany(
      {
        institutionId: institutionOid,
        programId: { $in: optionalProgramIds },
        deletedAt: null,
        status: { $ne: 'archived' },
      },
      { $set: { deletedAt: new Date(), status: 'archived' } },
    ).exec();

    for (const program of optionalPrograms) {
      const studentsOnProgram = await StudentModel.countDocuments({
        institutionId: institutionOid,
        programId: program._id,
        deletedAt: null,
      }).exec();
      if (studentsOnProgram === 0 && program.status !== 'archived') {
        await softArchiveProgram(institutionOid, program._id);
      }
    }
  }

  await removePostgraduateTimetableSlots(institutionOid);

  const sectionCandidates = await SectionModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    status: { $ne: 'archived' },
    name: DEMO_SECTION_NAME,
  })
    .select('_id')
    .lean()
    .exec();

  for (const section of sectionCandidates) {
    if (await sectionIsUnused(institutionOid, section._id)) {
      await softArchiveSection(institutionOid, section._id);
    }
  }

  const batches = await BatchModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    status: { $ne: 'archived' },
  })
    .select('_id name')
    .lean()
    .exec();

  for (const batch of batches) {
    const students = await StudentModel.countDocuments({
      institutionId: institutionOid,
      batchId: batch._id,
      deletedAt: null,
    }).exec();
    if (students === 0 && DEMO_BATCH_NAME.test(batch.name)) {
      await softArchiveBatch(institutionOid, batch._id);
    }
  }

  await pruneSoeLearningCatalog(institutionId);
}
