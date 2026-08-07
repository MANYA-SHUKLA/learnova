/**
 * Seed enrollments into MongoDB.
 * Usage: pnpm --filter @learnova/backend seed:enrollments
 *
 * Prerequisites:
 * - Institution, Students, Courses, Faculty, and related entities must exist
 * - Pass IDs via environment variables or modify this script
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { seedEnrollments } from './enrollment.seed.js';

async function main(): Promise<void> {
  await connectMongo();

  const institutionId = process.env.SEED_INSTITUTION_ID || '507f1f77bcf86cd799439011';
  const refs = {
    studentIds: (
      process.env.SEED_STUDENT_IDS ||
      '507f1f77bcf86cd799439050,507f1f77bcf86cd799439051,507f1f77bcf86cd799439052,507f1f77bcf86cd799439053,507f1f77bcf86cd799439054'
    ).split(','),
    courseIds: (
      process.env.SEED_COURSE_IDS ||
      '507f1f77bcf86cd799439060,507f1f77bcf86cd799439061,507f1f77bcf86cd799439062,507f1f77bcf86cd799439063,507f1f77bcf86cd799439064'
    ).split(','),
    facultyIds: (
      process.env.SEED_FACULTY_IDS ||
      '507f1f77bcf86cd79943902f,507f1f77bcf86cd799439030,507f1f77bcf86cd799439031'
    ).split(','),
    departmentIds: (
      process.env.SEED_DEPARTMENT_IDS || '507f1f77bcf86cd799439014,507f1f77bcf86cd799439015'
    ).split(','),
    programIds: (
      process.env.SEED_PROGRAM_IDS || '507f1f77bcf86cd799439019,507f1f77bcf86cd79943901a'
    ).split(','),
    academicYearIds: (
      process.env.SEED_ACADEMIC_YEAR_IDS || '507f1f77bcf86cd79943901d'
    ).split(','),
    semesterIds: (
      process.env.SEED_SEMESTER_IDS || '507f1f77bcf86cd79943901e,507f1f77bcf86cd79943902d'
    ).split(','),
    sectionIds: (
      process.env.SEED_SECTION_IDS || '507f1f77bcf86cd799439070,507f1f77bcf86cd799439071'
    ).split(','),
    userId: process.env.SEED_USER_ID || '507f1f77bcf86cd799439034',
  };

  await seedEnrollments(institutionId, refs);
  logger.info('Enrollment seed completed (1000+ enrollments)');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Enrollment seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
