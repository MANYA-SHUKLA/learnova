import { Types } from 'mongoose';
import {
  CourseModel,
  EnrollmentModel,
  EnrollmentWaitlistModel,
} from '../../models/index.js';
import {
  isDemoCourse,
  loadSoeCourseRetentionContext,
  pruneSoeCourses,
} from './prune-soe-courses.js';
import { pruneSoeQuizzes } from './prune-soe-quizzes.js';

export async function listJunkSoeCourseIds(
  institutionId: string,
): Promise<{ institutionOid: Types.ObjectId; junkCourseIds: Types.ObjectId[] } | null> {
  const ctx = await loadSoeCourseRetentionContext(institutionId);
  if (!ctx) return null;

  const { institutionOid, keepIds } = ctx;

  const courseMeta = await CourseModel.find({ institutionId: institutionOid })
    .select('_id courseCode title deletedAt')
    .lean()
    .exec();

  const junkCourseIds: Types.ObjectId[] = [];
  for (const course of courseMeta) {
    const id = String(course._id);
    if (course.deletedAt) {
      junkCourseIds.push(course._id);
      continue;
    }
    if (isDemoCourse(course.courseCode, course.title)) {
      junkCourseIds.push(course._id);
      continue;
    }
    if (!keepIds.has(id)) {
      junkCourseIds.push(course._id);
    }
  }

  return { institutionOid, junkCourseIds };
}

/**
 * Removes enrollments tied to demo/legacy courses outside the SOE B.Tech catalog.
 * Run before {@link pruneSoeCourses} so courses blocked by enrollments can be archived.
 */
export async function pruneSoeEnrollments(institutionId: string): Promise<void> {
  const resolved = await listJunkSoeCourseIds(institutionId);
  if (!resolved) return;

  const { institutionOid, junkCourseIds } = resolved;
  if (junkCourseIds.length === 0) return;

  await EnrollmentModel.updateMany(
    {
      institutionId: institutionOid,
      deletedAt: null,
      courseId: { $in: junkCourseIds },
    },
    { $set: { deletedAt: new Date(), status: 'withdrawn' } },
  ).exec();

  await EnrollmentWaitlistModel.updateMany(
    {
      institutionId: institutionOid,
      courseId: { $in: junkCourseIds },
      status: 'waiting',
    },
    { $set: { status: 'expired' } },
  ).exec();
}

/** Prune junk enrollments, then stray courses (SOE B.Tech campuses only). */
export async function pruneSoeLearningCatalog(institutionId: string): Promise<void> {
  await pruneSoeEnrollments(institutionId);
  await pruneSoeQuizzes(institutionId);
  await pruneSoeCourses(institutionId);
}
