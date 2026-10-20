import { Types } from 'mongoose';
import { TimetableSlotModel } from '../../models/index.js';

/**
 * One faculty, one room, one course at one time = one class (possibly CSE + ECE combined).
 * Removes duplicate slot rows left from per-section seeding.
 */
export async function mergeJointTimetableSlots(institutionId: string): Promise<number> {
  const institutionOid = new Types.ObjectId(institutionId);
  const slots = await TimetableSlotModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    status: 'active',
  })
    .select('_id dayOfWeek startTime endTime facultyId courseId room sectionId sectionName')
    .lean()
    .exec();

  const groups = new Map<string, typeof slots>();
  for (const slot of slots) {
    const key = [
      slot.dayOfWeek,
      slot.startTime,
      slot.endTime,
      String(slot.facultyId),
      String(slot.courseId),
      String(slot.sectionId),
      slot.room.trim().toLowerCase(),
    ].join('|');
    const list = groups.get(key) ?? [];
    list.push(slot);
    groups.set(key, list);
  }

  let removed = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const [keep, ...dupes] = group;
    if (!keep) continue;
    const names = new Set(
      keep.sectionName
        .split('+')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    for (const dup of dupes) {
      for (const part of dup.sectionName.split('+')) {
        const name = part.trim();
        if (name) names.add(name);
      }
      await TimetableSlotModel.updateOne(
        { _id: dup._id },
        { $set: { deletedAt: new Date(), status: 'inactive' } },
      ).exec();
      removed += 1;
    }
    const merged = [...names].join(' + ');
    if (merged !== keep.sectionName) {
      await TimetableSlotModel.updateOne(
        { _id: keep._id },
        { $set: { sectionName: merged } },
      ).exec();
    }
  }

  return removed;
}
