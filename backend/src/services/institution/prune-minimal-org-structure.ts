import { Types } from 'mongoose';
import {
  BatchModel,
  EnrollmentModel,
  ProgramModel,
  SectionModel,
  StudentModel,
} from '../../models/index.js';

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

/**
 * Keeps org structure lean: drop unused optional-program sections, demo rows, and empty batches.
 * Safe to run on every calendar sync (idempotent).
 */
export async function pruneMinimalOrgStructure(institutionId: string): Promise<void> {
  const institutionOid = new Types.ObjectId(institutionId);

  const optionalPrograms = await ProgramModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    $or: [{ code: /^MT-/ }, { code: 'PHD' }],
  })
    .select('_id')
    .lean()
    .exec();

  const optionalProgramIds = optionalPrograms.map((p) => p._id);

  const sectionCandidates = await SectionModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    status: { $ne: 'archived' },
    $or: [
      ...(optionalProgramIds.length > 0 ? [{ programId: { $in: optionalProgramIds } }] : []),
      { name: DEMO_SECTION_NAME },
    ],
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
}
