import { Types } from 'mongoose';
import {
  CourseModel,
  EnrollmentModel,
  ProgramModel,
  TimetableSlotModel,
} from '../../models/index.js';
import { btechProgramListFilter } from './soe-org-filters.js';
import { allJnuBtechOfficialCourseCodes } from '../timetable/jnu-soe-monsoon-2026.js';

const DEMO_COURSE_CODE = /^SEED-/i;
const DEMO_COURSE_TITLE = /^Seed Course \d+$/i;

async function softArchiveCourse(institutionOid: Types.ObjectId, courseId: Types.ObjectId) {
  await CourseModel.updateOne(
    { _id: courseId, institutionId: institutionOid, deletedAt: null },
    { $set: { deletedAt: new Date(), status: 'archived' } },
  ).exec();
}

async function hasActiveEnrollments(
  institutionOid: Types.ObjectId,
  courseId: Types.ObjectId,
): Promise<boolean> {
  const count = await EnrollmentModel.countDocuments({
    institutionId: institutionOid,
    courseId,
    deletedAt: null,
    status: { $nin: ['dropped', 'withdrawn', 'rejected', 'expired'] },
  }).exec();
  return count > 0;
}

async function isSoeBtechCampus(institutionOid: Types.ObjectId): Promise<boolean> {
  const count = await ProgramModel.countDocuments({
    institutionId: institutionOid,
    deletedAt: null,
    ...btechProgramListFilter(),
  }).exec();
  return count >= 2;
}

export function isDemoCourse(courseCode: string | undefined, title: string | undefined): boolean {
  return DEMO_COURSE_CODE.test(courseCode ?? '') || DEMO_COURSE_TITLE.test(title ?? '');
}

export type SoeCourseRetentionContext = {
  institutionOid: Types.ObjectId;
  officialCodes: ReadonlySet<string>;
  btechProgramIds: Set<string>;
  slotCourseIds: Set<string>;
  keepIds: Set<string>;
};

export async function loadSoeCourseRetentionContext(
  institutionId: string,
): Promise<SoeCourseRetentionContext | null> {
  const institutionOid = new Types.ObjectId(institutionId);
  if (!(await isSoeBtechCampus(institutionOid))) return null;

  const officialCodes = allJnuBtechOfficialCourseCodes();
  const btechPrograms = await ProgramModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    ...btechProgramListFilter(),
  })
    .select('_id')
    .lean()
    .exec();
  const btechProgramIds = new Set(btechPrograms.map((p) => String(p._id)));

  const slotCourseIds = new Set(
    (
      await TimetableSlotModel.find({
        institutionId: institutionOid,
        deletedAt: null,
        courseId: { $ne: null },
      })
        .select('courseId')
        .lean()
        .exec()
    )
      .map((s) => (s.courseId ? String(s.courseId) : null))
      .filter(Boolean) as string[],
  );

  const courses = await CourseModel.find({
    institutionId: institutionOid,
    deletedAt: null,
  })
    .select('_id courseCode title programIds')
    .lean()
    .exec();

  const keepIds = new Set<string>();
  for (const course of courses) {
    const id = String(course._id);
    if (isDemoCourse(course.courseCode, course.title)) continue;

    const code = (course.courseCode ?? '').trim().toUpperCase();
    const inTimetable = slotCourseIds.has(id);
    const isOfficial = officialCodes.has(code);
    const programIds = (course.programIds ?? []).map((p) => String(p));
    const onBtech =
      programIds.length === 0 || programIds.some((pid) => btechProgramIds.has(pid));

    if (inTimetable || (isOfficial && onBtech)) {
      keepIds.add(id);
    }
  }

  return { institutionOid, officialCodes, btechProgramIds, slotCourseIds, keepIds };
}

/**
 * Archives demo/seed courses and stray catalog rows outside the official SOE B.Tech grid.
 * Idempotent — safe on calendar sync and course list/stats.
 */
export async function pruneSoeCourses(institutionId: string): Promise<void> {
  const ctx = await loadSoeCourseRetentionContext(institutionId);
  if (!ctx) return;

  const { institutionOid, officialCodes, slotCourseIds, keepIds } = ctx;

  const courses = await CourseModel.find({
    institutionId: institutionOid,
    deletedAt: null,
  })
    .select('_id courseCode title programIds updatedAt')
    .lean()
    .exec();

  for (const course of courses) {
    const id = String(course._id);
    if (keepIds.has(id)) continue;

    const code = (course.courseCode ?? '').trim().toUpperCase();
    const inTimetable = slotCourseIds.has(id);
    const isOfficial = officialCodes.has(code);
    const isDemo = isDemoCourse(course.courseCode, course.title);

    const shouldArchive = isDemo || (!inTimetable && !isOfficial);
    if (!shouldArchive) continue;
    if (await hasActiveEnrollments(institutionOid, course._id)) continue;
    await softArchiveCourse(institutionOid, course._id);
  }

  const activeAfter = await CourseModel.find({
    institutionId: institutionOid,
    deletedAt: null,
  })
    .select('_id courseCode updatedAt')
    .lean()
    .exec();

  const byCode = new Map<string, typeof activeAfter>();
  for (const row of activeAfter) {
    const key = (row.courseCode ?? '').trim().toUpperCase();
    if (!key) continue;
    const group = byCode.get(key) ?? [];
    group.push(row);
    byCode.set(key, group);
  }

  for (const group of byCode.values()) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => {
      const aSlot = slotCourseIds.has(String(a._id)) ? 1 : 0;
      const bSlot = slotCourseIds.has(String(b._id)) ? 1 : 0;
      if (aSlot !== bSlot) return bSlot - aSlot;
      const aKeep = keepIds.has(String(a._id)) ? 1 : 0;
      const bKeep = keepIds.has(String(b._id)) ? 1 : 0;
      if (aKeep !== bKeep) return bKeep - aKeep;
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
    for (let i = 1; i < sorted.length; i += 1) {
      const dupId = sorted[i]!._id;
      if (await hasActiveEnrollments(institutionOid, dupId)) continue;
      await softArchiveCourse(institutionOid, dupId);
    }
  }
}
