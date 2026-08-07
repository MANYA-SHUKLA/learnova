/**
 * Seed courses into MongoDB.
 * Usage: pnpm --filter @learnova/backend seed:courses
 *
 * Prerequisites:
 * - Institution, Campus, School, Department, Program, Semester, and Faculty must exist
 * - Pass IDs via environment variables or modify this script
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { seedCourses } from './course.seed.js';

async function main(): Promise<void> {
  await connectMongo();

  // Replace these with actual IDs from your database
  const institutionId = process.env.SEED_INSTITUTION_ID || '507f1f77bcf86cd799439011';
  const refs = {
    campusIds: (process.env.SEED_CAMPUS_IDS || '507f1f77bcf86cd799439012').split(','),
    schoolIds: (process.env.SEED_SCHOOL_IDS || '507f1f77bcf86cd799439013').split(','),
    departmentIds: (
      process.env.SEED_DEPARTMENT_IDS ||
      '507f1f77bcf86cd799439014,507f1f77bcf86cd799439015,507f1f77bcf86cd799439016,507f1f77bcf86cd799439017,507f1f77bcf86cd799439018'
    ).split(','),
    programIds: (
      process.env.SEED_PROGRAM_IDS ||
      '507f1f77bcf86cd799439019,507f1f77bcf86cd79943901a,507f1f77bcf86cd79943901b,507f1f77bcf86cd79943901c'
    ).split(','),
    semesterIds: (
      process.env.SEED_SEMESTER_IDS ||
      '507f1f77bcf86cd79943901e,507f1f77bcf86cd79943902d,507f1f77bcf86cd79943902e'
    ).split(','),
    facultyIds: (
      process.env.SEED_FACULTY_IDS ||
      '507f1f77bcf86cd79943902f,507f1f77bcf86cd799439030,507f1f77bcf86cd799439031,507f1f77bcf86cd799439032,507f1f77bcf86cd799439033'
    ).split(','),
    userId: process.env.SEED_USER_ID || '507f1f77bcf86cd799439034',
  };

  await seedCourses(institutionId, refs);
  logger.info('Course seed completed (30 courses)');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Course seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
