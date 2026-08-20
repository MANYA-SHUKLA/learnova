import { Types } from 'mongoose';
import {
  CourseModel,
  FacultyModel,
  SectionModel,
  SemesterModel,
  TimetableModel,
  TimetableSlotModel,
} from '../models/index.js';
import { logger } from '../utils/logger/index.js';

export interface TimetableSeedOptions {
  force?: boolean;
}

export async function seedTimetable(
  institutionId: string,
  options: TimetableSeedOptions = {},
): Promise<{ timetableId: string; slots: number }> {
  const institutionOid = new Types.ObjectId(institutionId);

  const semester = await SemesterModel.findOne({
    institutionId: institutionOid,
    status: 'active',
    deletedAt: null,
  })
    .sort({ startDate: -1 })
    .lean()
    .exec();

  if (!semester) {
    logger.warn('No active semester found — skipping timetable seed');
    return { timetableId: '', slots: 0 };
  }

  const semesterId = String(semester._id);

  const existing = await TimetableModel.findOne({
    institutionId: institutionOid,
    semesterId: semester._id,
    deletedAt: null,
  }).lean();

  if (existing && !options.force) {
    const slotCount = await TimetableSlotModel.countDocuments({
      timetableId: existing._id,
      deletedAt: null,
    });
    logger.info({ timetableId: String(existing._id), slotCount }, 'Timetable already seeded');
    return { timetableId: String(existing._id), slots: slotCount };
  }

  if (existing && options.force) {
    await TimetableSlotModel.deleteMany({ timetableId: existing._id });
    await TimetableModel.deleteOne({ _id: existing._id });
  }

  const [courses, sections, faculty] = await Promise.all([
    CourseModel.find({ institutionId: institutionOid, deletedAt: null, status: 'published' })
      .select('_id title')
      .limit(2)
      .lean()
      .exec(),
    SectionModel.find({ institutionId: institutionOid, deletedAt: null, status: 'active' })
      .select('_id name')
      .limit(2)
      .lean()
      .exec(),
    FacultyModel.find({ institutionId: institutionOid, deletedAt: null, status: 'active' })
      .select('_id fullName firstName lastName email')
      .limit(2)
      .lean()
      .exec(),
  ]);

  if (courses.length === 0 || sections.length === 0 || faculty.length === 0) {
    logger.warn('Missing courses, sections, or faculty — skipping timetable seed');
    return { timetableId: '', slots: 0 };
  }

  const timetable = await TimetableModel.create({
    institutionId: institutionOid,
    semesterId: semester._id,
    academicYearId: semester.academicYearId,
    name: `SOE JNU — ${semester.name} Timetable`,
    status: 'published',
    publishedAt: new Date(),
    deletedAt: null,
  });

  const slotSpecs = [
    { dayOfWeek: 'mon' as const, startTime: '09:00', endTime: '10:00', courseIdx: 0, sectionIdx: 0, facultyIdx: 0, room: 'Room 101' },
    { dayOfWeek: 'mon' as const, startTime: '10:00', endTime: '11:00', courseIdx: 1, sectionIdx: 1, facultyIdx: 1, room: 'Room 102' },
    { dayOfWeek: 'wed' as const, startTime: '09:00', endTime: '10:00', courseIdx: 0, sectionIdx: 1, facultyIdx: 0, room: 'Lab 3' },
    { dayOfWeek: 'wed' as const, startTime: '14:00', endTime: '15:00', courseIdx: 1, sectionIdx: 0, facultyIdx: 1, room: 'Room 201' },
    { dayOfWeek: 'fri' as const, startTime: '11:00', endTime: '12:00', courseIdx: 0, sectionIdx: 0, facultyIdx: 0, room: 'Room 101' },
    { dayOfWeek: 'fri' as const, startTime: '11:00', endTime: '12:00', courseIdx: 1, sectionIdx: 1, facultyIdx: 1, room: 'Room 102' },
  ];

  const slots = slotSpecs.map((spec) => {
    const course = courses[spec.courseIdx]!;
    const section = sections[spec.sectionIdx]!;
    const fac = faculty[spec.facultyIdx]!;
    const facultyName =
      (fac.fullName as string) ||
      `${fac.firstName as string} ${fac.lastName as string}`.trim();
    return {
      timetableId: timetable._id,
      institutionId: institutionOid,
      semesterId: semester._id,
      dayOfWeek: spec.dayOfWeek,
      startTime: spec.startTime,
      endTime: spec.endTime,
      courseId: course._id,
      courseTitle: course.title as string,
      sectionId: section._id,
      sectionName: section.name as string,
      facultyId: fac._id,
      facultyName,
      room: spec.room,
      status: 'active' as const,
      deletedAt: null,
    };
  });

  await TimetableSlotModel.insertMany(slots);
  logger.info(
    { timetableId: String(timetable._id), slots: slots.length },
    'Timetable seed complete',
  );
  return { timetableId: String(timetable._id), slots: slots.length };
}
