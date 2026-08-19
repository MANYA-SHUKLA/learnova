/**
 * Minimal practice-lab bootstrap when full enrollment-stack has not run.
 * Creates one published course + demo student enrollment, then seeds a small lab set.
 *
 * Usage: pnpm --filter @learnova/backend seed:practice-lab-bootstrap
 */

import '../config/load-env.js';
import { Types } from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import {
  CourseModel,
  EnrollmentModel,
  FacultyModel,
  PracticeLabModel,
  StudentModel,
  UserModel,
} from '../models/index.js';
import { logger } from '../utils/logger/index.js';
import { DEMO_STUDENT_EMAIL } from './demo-users.seed.js';
import { seedPracticeLabs, repairPracticeLabTestCases } from './practice-lab.seed.js';

async function main(): Promise<void> {
  const institutionId = process.env.SEED_INSTITUTION_ID?.trim();
  if (!institutionId) throw new Error('SEED_INSTITUTION_ID is required');

  await connectMongo();
  const institutionOid = new Types.ObjectId(institutionId);

  const [admin, faculty, student] = await Promise.all([
    UserModel.findOne({ institutionId: institutionOid }).select('_id email').lean(),
    FacultyModel.findOne({
      institutionId: institutionOid,
      email: 'faculty.demo@learnova.test',
      deletedAt: null,
    })
      .select('_id')
      .lean(),
    StudentModel.findOne({
      institutionId: institutionOid,
      email: DEMO_STUDENT_EMAIL,
      deletedAt: null,
    })
      .select('_id')
      .lean(),
  ]);

  if (!admin) throw new Error('No institution admin user — log in / register first');
  if (!faculty) throw new Error('Run pnpm seed:demo first (faculty.demo@learnova.test)');
  if (!student) throw new Error(`Run pnpm seed:demo first (${DEMO_STUDENT_EMAIL})`);

  let course = await CourseModel.findOne({
    institutionId: institutionOid,
    courseCode: 'LAB-DEMO-101',
    deletedAt: null,
  }).lean();

  if (!course) {
    const created = await CourseModel.create({
      institutionId: institutionOid,
      courseCode: 'LAB-DEMO-101',
      slug: 'lab-demo-101',
      title: 'Programming Practice Demo',
      description: 'Demo course for practice labs and Judge0 runs.',
      category: 'programming',
      status: 'published',
      visibility: 'institution',
      facultyIds: [faculty._id],
      coordinatorId: faculty._id,
      createdBy: admin._id,
      updatedBy: admin._id,
      deletedAt: null,
    });
    course = created.toObject();
    logger.info({ courseId: String(course._id) }, 'Created demo course LAB-DEMO-101');
  }

  const courseId = String(course._id);
  const studentId = String(student._id);

  const existingEnrollment = await EnrollmentModel.findOne({
    institutionId: institutionOid,
    courseId: course._id,
    studentId: student._id,
    deletedAt: null,
  }).lean();

  if (!existingEnrollment) {
    await EnrollmentModel.create({
      institutionId: institutionOid,
      courseId: course._id,
      studentId: student._id,
      facultyId: faculty._id,
      enrollmentNumber: `ENR-LAB-${Date.now()}`,
      status: 'active',
      enrollmentMethod: 'manual',
      deletedAt: null,
    });
    logger.info({ courseId, studentId }, 'Enrolled demo student in LAB-DEMO-101');
  }

  const result = await seedPracticeLabs(
    institutionId,
    {
      courseIds: [courseId],
      studentIds: [studentId],
      userId: String(admin._id),
    },
    {
      force: process.env.SEED_FORCE === '1' || process.env.SEED_FORCE === 'true',
      labTarget: 3,
      problemTarget: 9,
      testCaseTarget: 27,
      submissionTarget: 0,
      publishAll: true,
    },
  );

  const republished = await PracticeLabModel.updateMany(
    {
      institutionId: institutionOid,
      courseId: course._id,
      deletedAt: null,
      status: { $ne: 'published' },
    },
    { $set: { status: 'published', updatedBy: admin._id } },
  );
  if (republished.modifiedCount > 0) {
    logger.info({ count: republished.modifiedCount }, 'Republished demo practice labs');
  }

  const repairedCases = await repairPracticeLabTestCases(institutionId);
  if (repairedCases > 0) {
    logger.info({ count: repairedCases }, 'Repaired practice lab test cases to match problem samples');
  }

  logger.info(result, 'Practice lab bootstrap completed');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Practice lab bootstrap failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
