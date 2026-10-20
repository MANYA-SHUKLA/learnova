import { Types } from 'mongoose';
import {
  CourseModel,
  EnrollmentModel,
  StudentModel,
  TimetableModel,
  TimetableSlotModel,
} from '../../models/index.js';
import { logger } from '../../utils/logger/index.js';

function oid(id: string | Types.ObjectId): Types.ObjectId {
  return id instanceof Types.ObjectId ? id : new Types.ObjectId(id);
}

type SectionCourseKey = string;

/**
 * Ensures every student in a timetable section is enrolled in courses scheduled for that section.
 * Also links faculty from slots onto course.facultyIds so faculty dashboards see assigned courses.
 */
export async function syncTimetableSectionEnrollments(
  institutionId: string,
): Promise<{ enrollmentsCreated: number; enrollmentsUpdated: number; coursesLinked: number }> {
  const institutionOid = oid(institutionId);

  const slots = await TimetableSlotModel.find({
    institutionId: institutionOid,
    deletedAt: null,
    status: 'active',
  })
    .select('courseId sectionId facultyId semesterId timetableId')
    .lean()
    .exec();

  if (slots.length === 0) {
    return { enrollmentsCreated: 0, enrollmentsUpdated: 0, coursesLinked: 0 };
  }

  const timetableIds = [...new Set(slots.map((s) => String(s.timetableId)))];
  const timetables = await TimetableModel.find({ _id: { $in: timetableIds.map(oid) } })
    .select('_id academicYearId')
    .lean()
    .exec();
  const academicYearByTimetable = new Map(
    timetables.map((t) => [String(t._id), t.academicYearId ?? null]),
  );

  const sectionCourse = new Map<
    SectionCourseKey,
    {
      courseId: Types.ObjectId;
      sectionId: Types.ObjectId;
      facultyId: Types.ObjectId;
      semesterId: Types.ObjectId;
      academicYearId: Types.ObjectId | null;
    }
  >();

  for (const slot of slots) {
    const key = `${String(slot.sectionId)}|${String(slot.courseId)}`;
    if (sectionCourse.has(key)) continue;
    sectionCourse.set(key, {
      courseId: slot.courseId as Types.ObjectId,
      sectionId: slot.sectionId as Types.ObjectId,
      facultyId: slot.facultyId as Types.ObjectId,
      semesterId: slot.semesterId as Types.ObjectId,
      academicYearId:
        (academicYearByTimetable.get(String(slot.timetableId)) as Types.ObjectId | null) ?? null,
    });
  }

  let enrollmentsCreated = 0;
  let enrollmentsUpdated = 0;
  let coursesLinked = 0;

  for (const row of sectionCourse.values()) {
    const course = await CourseModel.findOne({
      _id: row.courseId,
      institutionId: institutionOid,
      deletedAt: null,
    })
      .select('_id departmentId programIds')
      .lean()
      .exec();
    if (!course) continue;

    const linkResult = await CourseModel.updateOne(
      { _id: row.courseId },
      { $addToSet: { facultyIds: row.facultyId } },
    ).exec();
    if (linkResult.modifiedCount > 0) coursesLinked += 1;

    const programId = (course.programIds?.[0] as Types.ObjectId | undefined) ?? null;

    const students = await StudentModel.find({
      institutionId: institutionOid,
      sectionId: row.sectionId,
      deletedAt: null,
      isActive: true,
    })
      .select('_id departmentId programId sectionId academicYearId')
      .lean()
      .exec();

    for (const student of students) {
      const existing = await EnrollmentModel.findOne({
        institutionId: institutionOid,
        studentId: student._id,
        courseId: row.courseId,
        deletedAt: null,
      })
        .select('_id')
        .lean()
        .exec();

      const enrollmentNumber = `ENR-TT-${String(student._id).slice(-6)}-${String(row.courseId).slice(-6)}`;
      await EnrollmentModel.findOneAndUpdate(
        {
          institutionId: institutionOid,
          studentId: student._id,
          courseId: row.courseId,
          deletedAt: null,
        },
        {
          $set: {
            departmentId: student.departmentId ?? course.departmentId ?? null,
            programId: student.programId ?? programId,
            academicYearId: student.academicYearId ?? row.academicYearId,
            semesterId: row.semesterId,
            sectionId: row.sectionId,
            facultyId: row.facultyId,
            status: 'active',
            approvalStatus: 'approved',
            completionStatus: 'not_started',
            enrollmentMethod: 'manual',
            enrollmentDate: new Date(),
          },
          $setOnInsert: {
            enrollmentNumber,
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      ).exec();

      if (existing) enrollmentsUpdated += 1;
      else enrollmentsCreated += 1;
    }
  }

  logger.info(
    { institutionId, enrollmentsCreated, enrollmentsUpdated, coursesLinked, pairs: sectionCourse.size },
    'Synced timetable section enrollments',
  );

  return { enrollmentsCreated, enrollmentsUpdated, coursesLinked };
}
