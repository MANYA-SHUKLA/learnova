/**
 * Seed students into MongoDB.
 * Usage: pnpm --filter @learnova/backend seed:students
 *
 * Prerequisites:
 * - Institution, Campus, School, Department, Program, AcademicYear, Semester, Section, and Batch must exist
 * - Pass IDs via environment variables or modify this script
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { seedStudents } from './student.seed.js';

async function main(): Promise<void> {
  await connectMongo();

  // Replace these with actual IDs from your database
  const institutionId = process.env.SEED_INSTITUTION_ID || '507f1f77bcf86cd799439011';
  const refs = {
    campusIds: (process.env.SEED_CAMPUS_IDS || '507f1f77bcf86cd799439012').split(','),
    schoolIds: (process.env.SEED_SCHOOL_IDS || '507f1f77bcf86cd799439013').split(','),
    departmentIds: (process.env.SEED_DEPARTMENT_IDS || '507f1f77bcf86cd799439014,507f1f77bcf86cd799439015,507f1f77bcf86cd799439016,507f1f77bcf86cd799439017,507f1f77bcf86cd799439018').split(','),
    programIds: (process.env.SEED_PROGRAM_IDS || '507f1f77bcf86cd799439019,507f1f77bcf86cd79943901a,507f1f77bcf86cd79943901b,507f1f77bcf86cd79943901c').split(','),
    academicYearIds: (process.env.SEED_ACADEMIC_YEAR_IDS || '507f1f77bcf86cd79943901d').split(','),
    semesterIds: (process.env.SEED_SEMESTER_IDS || '507f1f77bcf86cd79943901e').split(','),
    sectionIds: (process.env.SEED_SECTION_IDS || '507f1f77bcf86cd79943901f,507f1f77bcf86cd799439020,507f1f77bcf86cd799439021,507f1f77bcf86cd799439022,507f1f77bcf86cd799439023,507f1f77bcf86cd799439024,507f1f77bcf86cd799439025,507f1f77bcf86cd799439026,507f1f77bcf86cd799439027,507f1f77bcf86cd799439028').split(','),
    batchIds: (process.env.SEED_BATCH_IDS || '507f1f77bcf86cd799439029,507f1f77bcf86cd79943902a,507f1f77bcf86cd79943902b,507f1f77bcf86cd79943902c').split(','),
  };

  await seedStudents(institutionId, refs);
  logger.info('Student seed completed (200 students)');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Student seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
