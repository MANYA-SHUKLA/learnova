import { Types } from 'mongoose';
import { EnrollmentModel } from '../models/enrollment.model.js';
import { EnrollmentWaitlistModel } from '../models/enrollment-waitlist.model.js';
import { logger } from '../utils/logger/index.js';

const STATUSES = [
  'pending',
  'active',
  'approved',
  'rejected',
  'withdrawn',
  'completed',
  'dropped',
  'suspended',
  'archived',
] as const;

const ENROLLMENT_METHODS = ['self', 'manual', 'bulk', 'import', 'invite', 'promoted'] as const;
const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
const COMPLETION_STATUSES = ['not_started', 'in_progress', 'completed', 'failed'] as const;

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

interface SeedRefs {
  studentIds: string[];
  courseIds: string[];
  facultyIds: string[];
  campusIds: string[];
  schoolIds: string[];
  departmentIds: string[];
  programIds: string[];
  semesterIds: string[];
  sectionIds: string[];
  batchIds: string[];
  userId: string;
}

export async function seedEnrollments(institutionId: string, refs: SeedRefs): Promise<void> {
  const oid = new Types.ObjectId(institutionId);
  const userOid = new Types.ObjectId(refs.userId);

  logger.info({ institutionId }, 'Starting enrollment seed');

  const existing = await EnrollmentModel.countDocuments({ institutionId: oid });
  if (existing > 0) {
    logger.info({ existing }, 'Enrollments already exist, skipping seed');
    return;
  }

  const enrollments: Array<Record<string, unknown>> = [];
  const waitlistEntries: Array<Record<string, unknown>> = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date();

  const studentCourseSet = new Set<string>();

  for (let i = 0; i < 1200; i++) {
    const studentId = randomItem(refs.studentIds);
    const courseId = randomItem(refs.courseIds);
    const key = `${studentId}-${courseId}`;

    if (studentCourseSet.has(key)) continue;
    studentCourseSet.add(key);

    const status = randomItem(STATUSES);
    const enrollmentMethod = randomItem(ENROLLMENT_METHODS);
    const approvalStatus = randomItem(APPROVAL_STATUSES);
    const completionStatus = randomItem(COMPLETION_STATUSES);
    const enrollmentDate = randomDate(startDate, endDate);

    const enrollment: Record<string, unknown> = {
      institutionId: oid,
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      campusId: randomBool(0.8) ? new Types.ObjectId(randomItem(refs.campusIds)) : null,
      schoolId: randomBool(0.8) ? new Types.ObjectId(randomItem(refs.schoolIds)) : null,
      departmentId: randomBool(0.8) ? new Types.ObjectId(randomItem(refs.departmentIds)) : null,
      programId: randomBool(0.8) ? new Types.ObjectId(randomItem(refs.programIds)) : null,
      semesterId: randomBool(0.7) ? new Types.ObjectId(randomItem(refs.semesterIds)) : null,
      sectionId: randomBool(0.6)
        ? new Types.ObjectId(randomItem(refs.sectionIds))
        : null,
      batchId: randomBool(0.5) ? new Types.ObjectId(randomItem(refs.batchIds)) : null,
      facultyId: randomBool(0.7) ? new Types.ObjectId(randomItem(refs.facultyIds)) : null,
      status,
      enrollmentMethod,
      enrollmentDate,
      approvalStatus,
      approvalDate:
        approvalStatus === 'approved' || approvalStatus === 'rejected'
          ? randomDate(enrollmentDate, endDate)
          : null,
      approvedBy:
        approvalStatus === 'approved' || approvalStatus === 'rejected' ? userOid : null,
      rejectionReason:
        approvalStatus === 'rejected' ? 'Does not meet prerequisites' : null,
      withdrawalDate: status === 'withdrawn' ? randomDate(enrollmentDate, endDate) : null,
      withdrawalReason: status === 'withdrawn' ? 'Personal reasons' : null,
      completionDate: status === 'completed' ? randomDate(enrollmentDate, endDate) : null,
      completionStatus,
      progress: status === 'completed' ? 100 : randomInt(0, 90),
      grade: status === 'completed' ? randomItem(['A', 'B+', 'B', 'C+', 'C', 'D']) : null,
      score: status === 'completed' ? randomInt(60, 100) : randomInt(0, 80),
      credits: randomInt(1, 4),
      attendance: randomBool(0.7) ? randomInt(50, 100) : null,
      notes: randomBool(0.2) ? 'Sample notes' : null,
      metadata: {},
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: status === 'archived' ? new Date() : null,
    };

    enrollments.push(enrollment);
  }

  for (let i = 0; i < 50; i++) {
    const studentId = randomItem(refs.studentIds);
    const courseId = randomItem(refs.courseIds);
    const key = `${studentId}-${courseId}`;

    if (studentCourseSet.has(key)) continue;
    studentCourseSet.add(key);

    const waitlistEntry: Record<string, unknown> = {
      institutionId: oid,
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      position: i + 1,
      status: randomItem(['waiting', 'promoted', 'left', 'expired']),
      joinedAt: randomDate(startDate, endDate),
      promotedAt: randomBool(0.3) ? randomDate(startDate, endDate) : null,
      expiresAt: randomBool(0.2) ? randomDate(endDate, new Date('2025-12-31')) : null,
      notes: randomBool(0.2) ? 'Waitlist note' : null,
    };

    waitlistEntries.push(waitlistEntry);
  }

  logger.info({ count: enrollments.length }, 'Inserting enrollments');
  await EnrollmentModel.insertMany(enrollments, { ordered: false });

  logger.info({ count: waitlistEntries.length }, 'Inserting waitlist entries');
  await EnrollmentWaitlistModel.insertMany(waitlistEntries, { ordered: false });

  logger.info(
    { enrollments: enrollments.length, waitlist: waitlistEntries.length },
    'Enrollment seed completed',
  );
}
