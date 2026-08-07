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
  'expired',
] as const;

const ENROLLMENT_METHODS = [
  'manual',
  'bulk_import',
  'self_enrollment',
  'invite',
  'api',
] as const;
const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'not_required'] as const;
const COMPLETION_STATUSES = ['not_started', 'in_progress', 'completed'] as const;

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateEnrollmentNumber(index: number): string {
  return `ENR-${Date.now()}-${index.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

interface SeedRefs {
  studentIds: string[];
  courseIds: string[];
  facultyIds: string[];
  departmentIds: string[];
  programIds: string[];
  academicYearIds: string[];
  semesterIds: string[];
  sectionIds: string[];
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
    const completionStatus =
      status === 'completed' ? 'completed' : randomItem(COMPLETION_STATUSES);
    const enrollmentDate = randomDate(startDate, endDate);

    const enrollment: Record<string, unknown> = {
      institutionId: oid,
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      departmentId: randomBool(0.8) ? new Types.ObjectId(randomItem(refs.departmentIds)) : null,
      programId: randomBool(0.8) ? new Types.ObjectId(randomItem(refs.programIds)) : null,
      academicYearId: randomBool(0.8)
        ? new Types.ObjectId(randomItem(refs.academicYearIds))
        : null,
      semesterId: randomBool(0.7) ? new Types.ObjectId(randomItem(refs.semesterIds)) : null,
      sectionId: randomBool(0.6)
        ? new Types.ObjectId(randomItem(refs.sectionIds))
        : null,
      facultyId: randomBool(0.7) ? new Types.ObjectId(randomItem(refs.facultyIds)) : null,
      enrollmentNumber: generateEnrollmentNumber(i),
      status,
      enrollmentMethod,
      enrollmentDate,
      approvalStatus,
      approvedBy:
        approvalStatus === 'approved' || approvalStatus === 'rejected' ? userOid : null,
      withdrawReason: status === 'withdrawn' ? 'Personal reasons' : null,
      completionDate: status === 'completed' ? randomDate(enrollmentDate, endDate) : null,
      completionStatus,
      notes:
        approvalStatus === 'rejected'
          ? 'Does not meet prerequisites'
          : randomBool(0.2)
            ? 'Sample notes'
            : null,
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: null,
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
