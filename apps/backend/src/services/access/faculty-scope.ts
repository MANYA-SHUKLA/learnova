import { Types } from 'mongoose';
import { ASSESSMENT_ENROLLMENT_STATUSES } from '@learnova/constants';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { CourseModel } from '../../models/course.model.js';
import { FacultyModel } from '../../models/faculty.model.js';
import { StudentModel } from '../../models/student.model.js';
import { ForbiddenError } from '../../utils/errors/index.js';

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

export async function resolveStudentSelfObjectId(
  institutionId: string,
  email: string,
): Promise<Types.ObjectId | null> {
  const student = await StudentModel.findOne({
    institutionId: oid(institutionId),
    email: email.toLowerCase(),
    deletedAt: null,
  })
    .select('_id')
    .exec();
  return student?._id ?? null;
}

/** Restrict list queries to the signed-in student's own ERP record. */
export async function scopeStudentSelfFilter(
  filter: Record<string, unknown>,
  actor: { role: string; email: string },
  institutionId: string,
): Promise<Record<string, unknown>> {
  if (actor.role !== 'student') return filter;

  const selfId = await resolveStudentSelfObjectId(institutionId, actor.email);
  if (!selfId) {
    filter._id = null;
    return filter;
  }

  filter._id = selfId;
  return filter;
}

/** Restrict enrollment queries to the signed-in student. */
export async function scopeStudentEnrollmentFilter(
  filter: Record<string, unknown>,
  actor: { role: string; email: string },
  institutionId: string,
): Promise<Record<string, unknown>> {
  if (actor.role !== 'student') return filter;

  const selfId = await resolveStudentSelfObjectId(institutionId, actor.email);
  if (!selfId) {
    filter._id = null;
    return filter;
  }

  filter.studentId = selfId;
  return filter;
}

export async function assertStudentSelfAccess(
  institutionId: string,
  actor: { role: string; email: string },
  studentId: string,
): Promise<void> {
  if (actor.role !== 'student') return;

  const selfId = await resolveStudentSelfObjectId(institutionId, actor.email);
  if (!selfId || String(selfId) !== studentId) {
    throw new ForbiddenError('Not allowed to access this student record');
  }
}

/** Faculty course list filter — assigned or coordinator courses only. */
export async function buildFacultyCourseFilter(
  filter: Record<string, unknown>,
  actor: { role: string; email: string },
  institutionId: string,
): Promise<Record<string, unknown>> {
  if (actor.role !== 'faculty') return filter;

  const courseIds = await resolveFacultySupervisedCourseObjectIds(institutionId, actor.email);
  if (courseIds.length === 0) {
    filter._id = null;
    return filter;
  }

  filter._id = { $in: courseIds };
  return filter;
}

/** Faculty student list filter — enrolled in supervised courses only. */
export async function buildFacultyStudentFilter(
  filter: Record<string, unknown>,
  actor: { role: string; email: string },
  institutionId: string,
): Promise<Record<string, unknown>> {
  if (actor.role !== 'faculty') return filter;

  const studentIds = await resolveFacultyEnrolledStudentIds(institutionId, actor.email);
  if (studentIds.length === 0) {
    filter._id = null;
    return filter;
  }

  filter._id = { $in: studentIds };
  return filter;
}

export async function buildFacultyEnrollmentCourseFilter(
  filter: Record<string, unknown>,
  actor: { role: string; email: string },
  institutionId: string,
): Promise<Record<string, unknown>> {
  if (actor.role !== 'faculty') return filter;

  const courseIds = await resolveFacultySupervisedCourseObjectIds(institutionId, actor.email);
  if (courseIds.length === 0) {
    filter._id = null;
    return filter;
  }

  filter.courseId = { $in: courseIds };
  return filter;
}

/** Faculty directory list — own ERP record only (not institution-wide directory). */
export async function buildFacultySelfFilter(
  filter: Record<string, unknown>,
  actor: { role: string; email: string },
  institutionId: string,
): Promise<Record<string, unknown>> {
  if (actor.role !== 'faculty') return filter;

  const faculty = await findFacultyRecord(institutionId, actor.email);
  if (!faculty) {
    filter._id = null;
    return filter;
  }

  filter._id = faculty._id;
  return filter;
}

export async function assertFacultySelfAccess(
  institutionId: string,
  actor: { role: string; email: string },
  facultyId: string,
): Promise<void> {
  if (actor.role !== 'faculty') return;

  const faculty = await findFacultyRecord(institutionId, actor.email);
  if (!faculty || String(faculty._id) !== facultyId) {
    throw new ForbiddenError('Not allowed to access this faculty record');
  }
}
