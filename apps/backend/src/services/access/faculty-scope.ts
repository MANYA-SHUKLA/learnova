import { Types } from 'mongoose';
import { ASSESSMENT_ENROLLMENT_STATUSES } from '@learnova/constants';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { CourseModel } from '../../models/course.model.js';
import { FacultyModel } from '../../models/faculty.model.js';

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

export async function findFacultyRecord(institutionId: string, email: string) {
  return FacultyModel.findOne({
    institutionId: oid(institutionId),
    email: email.toLowerCase(),
    deletedAt: null,
  }).exec();
}

/** Courses where the faculty member is assigned or coordinator. */
export async function resolveFacultySupervisedCourseIds(
  institutionId: string,
  email: string,
): Promise<string[]> {
  const faculty = await findFacultyRecord(institutionId, email);
  if (!faculty) return [];

  const courses = await CourseModel.find({
    institutionId: oid(institutionId),
    deletedAt: null,
    $or: [{ facultyIds: faculty._id }, { coordinatorId: faculty._id }],
  })
    .select('_id')
    .exec();

  return courses.map((course) => String(course._id));
}

export async function resolveFacultySupervisedCourseObjectIds(
  institutionId: string,
  email: string,
): Promise<Types.ObjectId[]> {
  const ids = await resolveFacultySupervisedCourseIds(institutionId, email);
  return ids.map(oid);
}

/** Students actively enrolled in courses supervised by this faculty member. */
export async function resolveFacultyEnrolledStudentIds(
  institutionId: string,
  email: string,
): Promise<Types.ObjectId[]> {
  const courseIds = await resolveFacultySupervisedCourseObjectIds(institutionId, email);
  if (courseIds.length === 0) return [];

  const enrollments = await EnrollmentModel.find({
    institutionId: oid(institutionId),
    courseId: { $in: courseIds },
    deletedAt: null,
    status: { $in: [...ASSESSMENT_ENROLLMENT_STATUSES] },
  })
    .select('studentId')
    .exec();

  const unique = new Set<string>();
  for (const row of enrollments) {
    unique.add(String(row.studentId));
  }
  return [...unique].map(oid);
}

export async function facultyCanAccessCourse(
  institutionId: string,
  email: string,
  courseId: string,
): Promise<boolean> {
  const supervised = await resolveFacultySupervisedCourseIds(institutionId, email);
  return supervised.includes(courseId);
}

export async function facultyCanAccessStudent(
  institutionId: string,
  email: string,
  studentId: string,
): Promise<boolean> {
  const allowed = await resolveFacultyEnrolledStudentIds(institutionId, email);
  return allowed.some((id) => String(id) === studentId);
}
