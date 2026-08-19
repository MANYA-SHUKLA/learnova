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
  return `ENR-${Date.now().toString(36)}-${index.toString(36).padStart(4, '0')}-${Math.random().toString(36).slice(2, 6)}`;
}

export interface SeedRefs {
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

export interface SeedEnrollmentOptions {
  force?: boolean;
  target?: number;
  waitlistTarget?: number;
}

export async function seedEnrollments(
  institutionId: string,
  refs: SeedRefs,
  options: SeedEnrollmentOptions = {},
): Promise<{ enrollments: number; waitlist: number }> {
  const oid = new Types.ObjectId(institutionId);
  const userOid = new Types.ObjectId(refs.userId);
  const target = options.target ?? 1200;
  const waitlistTarget = options.waitlistTarget ?? 50;

  logger.info({ institutionId, target }, 'Starting enrollment seed');

  const existing = await EnrollmentModel.countDocuments({ institutionId: oid });
  if (existing > 0 && !options.force) {
    if (existing >= 1000) {
      logger.info({ existing }, 'Enrollments already exist (≥1000), skipping seed');
      return { enrollments: existing, waitlist: 0 };
    }
    logger.warn(
      { existing },
      'Fewer than 1000 enrollments found — clearing and reseeding (set SEED_FORCE=1 to force)',
    );
    await EnrollmentModel.deleteMany({ institutionId: oid });
    await EnrollmentWaitlistModel.deleteMany({ institutionId: oid });
  } else if (existing > 0 && options.force) {
    logger.warn({ existing }, 'SEED_FORCE set — clearing existing enrollments');
    await EnrollmentModel.deleteMany({ institutionId: oid });
    await EnrollmentWaitlistModel.deleteMany({ institutionId: oid });
  }

  const enrollments: Array<Record<string, unknown>> = [];
  const waitlistEntries: Array<Record<string, unknown>> = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date();
  const used = new Set<string>();

  // Systematic unique pairs so we hit target even with large pools
  outer: for (const studentId of refs.studentIds) {
    for (const courseId of refs.courseIds) {
      if (enrollments.length >= target) break outer;
      const key = `${studentId}:${courseId}`;
      if (used.has(key)) continue;
      used.add(key);

      const status = randomItem(STATUSES);
      const enrollmentMethod = randomItem(ENROLLMENT_METHODS);
      const approvalStatus =
        status === 'pending'
          ? 'pending'
          : status === 'rejected'
            ? 'rejected'
            : status === 'approved' || status === 'active' || status === 'completed'
              ? randomItem(['approved', 'not_required'] as const)
              : randomItem(APPROVAL_STATUSES);
      const completionStatus =
        status === 'completed' ? 'completed' : randomItem(COMPLETION_STATUSES);
      const enrollmentDate = randomDate(startDate, endDate);

      enrollments.push({
        institutionId: oid,
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
        departmentId: randomBool(0.8)
          ? new Types.ObjectId(randomItem(refs.departmentIds))
          : null,
        programId: randomBool(0.8) ? new Types.ObjectId(randomItem(refs.programIds)) : null,
        academicYearId: randomBool(0.8)
          ? new Types.ObjectId(randomItem(refs.academicYearIds))
          : null,
        semesterId: randomBool(0.7) ? new Types.ObjectId(randomItem(refs.semesterIds)) : null,
        sectionId: randomBool(0.6) ? new Types.ObjectId(randomItem(refs.sectionIds)) : null,
        facultyId: randomBool(0.7) ? new Types.ObjectId(randomItem(refs.facultyIds)) : null,
        enrollmentNumber: generateEnrollmentNumber(enrollments.length),
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
      });
    }
  }

  // Waitlist from remaining unused pairs
  let waitPosition = 1;
  for (const studentId of refs.studentIds) {
    if (waitlistEntries.length >= waitlistTarget) break;
    for (const courseId of refs.courseIds) {
      if (waitlistEntries.length >= waitlistTarget) break;
      const key = `${studentId}:${courseId}`;
      if (used.has(key)) continue;
      used.add(key);

      waitlistEntries.push({
        institutionId: oid,
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
        position: waitPosition++,
        status: randomItem(['waiting', 'promoted', 'left', 'expired'] as const),
        joinedAt: randomDate(startDate, endDate),
        promotedAt: randomBool(0.3) ? randomDate(startDate, endDate) : null,
        expiresAt: randomBool(0.2) ? randomDate(endDate, new Date('2026-12-31')) : null,
        notes: randomBool(0.2) ? 'Waitlist note' : null,
      });
    }
  }

  logger.info({ count: enrollments.length }, 'Inserting enrollments');
  if (enrollments.length > 0) {
    await EnrollmentModel.insertMany(enrollments, { ordered: false });
  }

  logger.info({ count: waitlistEntries.length }, 'Inserting waitlist entries');
  if (waitlistEntries.length > 0) {
    await EnrollmentWaitlistModel.insertMany(waitlistEntries, { ordered: false });
  }

  const result = { enrollments: enrollments.length, waitlist: waitlistEntries.length };
  logger.info(result, 'Enrollment seed completed');
  return result;
}
