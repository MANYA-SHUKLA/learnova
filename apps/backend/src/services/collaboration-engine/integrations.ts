import { Types } from 'mongoose';
import { ASSESSMENT_ENROLLMENT_STATUSES } from '@learnova/constants';
import type { CollaborationEnrollmentGate } from './types.js';
import { EnrollmentModel } from '../../models/enrollment.model.js';
import { CourseModel } from '../../models/course.model.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors/index.js';
import { resolveFacultySupervisedCourseIds as resolveFacultySupervisedCourseIdsFromScope } from '../access/faculty-scope.js';

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

/** Course + enrollment integration for the collaboration engine */
export const collaborationEnrollmentGate: CollaborationEnrollmentGate = {
  async assertEnrolled({ institutionId, studentId, courseId }) {
    const enrollment = await EnrollmentModel.findOne({
      institutionId: oid(institutionId),
      studentId: oid(studentId),
      courseId: oid(courseId),
      status: { $in: [...ASSESSMENT_ENROLLMENT_STATUSES] },
      deletedAt: null,
    }).exec();

    if (!enrollment) {
      throw new ForbiddenError('Active enrollment required for this course');
    }
  },

  async listEnrolledCourseIds({ institutionId, studentId }) {
    const rows = await EnrollmentModel.find({
      institutionId: oid(institutionId),
      studentId: oid(studentId),
      status: { $in: [...ASSESSMENT_ENROLLMENT_STATUSES] },
      deletedAt: null,
    })
      .select('courseId')
      .exec();

    return rows.map((row) => String(row.courseId));
  },
};

export async function resolveFacultySupervisedCourseIds(
  institutionId: string,
  email: string,
): Promise<string[]> {
  return resolveFacultySupervisedCourseIdsFromScope(institutionId, email);
}

export async function assertCourseInTenant(
  institutionId: string,
  courseId: string,
): Promise<void> {
  const course = await CourseModel.findOne({
    _id: oid(courseId),
    institutionId: oid(institutionId),
    deletedAt: null,
  }).exec();

  if (!course) {
    throw new NotFoundError('Course not found');
  }
}
