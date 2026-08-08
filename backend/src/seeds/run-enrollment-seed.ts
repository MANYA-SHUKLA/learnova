/**
 * Seed enrollments into MongoDB.
 * Usage: pnpm --filter @learnova/backend seed:enrollments
 *
 * Loads real Student / Course / Faculty / academic IDs for SEED_INSTITUTION_ID.
 * Requires enough unique student×course pairs for 1000+ enrollments
 * (e.g. seed:students + seed:courses first).
 *
 * Set SEED_FORCE=1 to replace existing enrollments for the institution.
 */

import '../config/load-env.js';
import { Types } from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import {
  AcademicYearModel,
  CourseModel,
  DepartmentModel,
  FacultyModel,
  ProgramModel,
  SectionModel,
  SemesterModel,
  StudentModel,
  UserModel,
} from '../models/index.js';
import { logger } from '../utils/logger/index.js';
import { seedEnrollments, type SeedRefs } from './enrollment.seed.js';

async function loadRefs(institutionId: string): Promise<SeedRefs> {
  const oid = new Types.ObjectId(institutionId);

  const [
    students,
    courses,
    faculty,
    departments,
    programs,
    academicYears,
    semesters,
    sections,
    user,
  ] = await Promise.all([
    StudentModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    CourseModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    FacultyModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    DepartmentModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    ProgramModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    AcademicYearModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    SemesterModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    SectionModel.find({ institutionId: oid, deletedAt: null }).select('_id').lean(),
    UserModel.findOne({ institutionId: oid }).select('_id').lean(),
  ]);

  const studentIds = students.map((d) => String(d._id));
  const courseIds = courses.map((d) => String(d._id));
  const capacity = studentIds.length * courseIds.length;

  logger.info(
    {
      students: studentIds.length,
      courses: courseIds.length,
      faculty: faculty.length,
      capacity,
    },
    'Loaded enrollment seed refs from database',
  );

  if (studentIds.length === 0 || courseIds.length === 0) {
    throw new Error(
      'No students and/or courses found for SEED_INSTITUTION_ID. Run seed:students and seed:courses first.',
    );
  }

  if (capacity < 1000) {
    throw new Error(
      `Not enough unique student×course pairs (${capacity}). Need ≥1000. ` +
        `Have ${studentIds.length} students × ${courseIds.length} courses. ` +
        `Run: pnpm --filter @learnova/backend seed:students && pnpm --filter @learnova/backend seed:courses`,
    );
  }

  const facultyIds = faculty.map((d) => String(d._id));
  const departmentIds = departments.map((d) => String(d._id));
  const programIds = programs.map((d) => String(d._id));
  const academicYearIds = academicYears.map((d) => String(d._id));
  const semesterIds = semesters.map((d) => String(d._id));
  const sectionIds = sections.map((d) => String(d._id));

  return {
    studentIds,
    courseIds,
    facultyIds: facultyIds.length > 0 ? facultyIds : [studentIds[0]!],
    departmentIds: departmentIds.length > 0 ? departmentIds : [studentIds[0]!],
    programIds: programIds.length > 0 ? programIds : [studentIds[0]!],
    academicYearIds: academicYearIds.length > 0 ? academicYearIds : [studentIds[0]!],
    semesterIds: semesterIds.length > 0 ? semesterIds : [studentIds[0]!],
    sectionIds: sectionIds.length > 0 ? sectionIds : [studentIds[0]!],
    userId: user ? String(user._id) : studentIds[0]!,
  };
}

async function main(): Promise<void> {
  await connectMongo();

  const institutionId = process.env.SEED_INSTITUTION_ID;
  if (!institutionId) {
    throw new Error('SEED_INSTITUTION_ID is required in backend/.env');
  }

  const force = process.env.SEED_FORCE === '1' || process.env.SEED_FORCE === 'true';
  const refs = await loadRefs(institutionId);
  const result = await seedEnrollments(institutionId, refs, { force, target: 1200 });

  logger.info(result, 'Enrollment seed completed');
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
