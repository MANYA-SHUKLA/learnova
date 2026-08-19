/**
 * Bootstrap academic structure + faculty/students/courses for enrollment seeding.
 * Usage: pnpm --filter @learnova/backend seed:enrollment-stack
 *
 * Creates (if missing) for SEED_INSTITUTION_ID:
 * - Campus, School, 5 Departments, 4 Programs, Academic Year, 6 Semesters, Sections, Batches
 * - 100 Faculty, 1000 Students, 100 Courses
 * - Then 1200+ Enrollments + waitlist
 */

import '../config/load-env.js';
import { Types } from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import {
  AcademicYearModel,
  BatchModel,
  CampusModel,
  CourseModel,
  DepartmentModel,
  FacultyModel,
  ProgramModel,
  SchoolModel,
  SectionModel,
  SemesterModel,
  StudentModel,
  UserModel,
} from '../models/index.js';
import { logger } from '../utils/logger/index.js';
import { seedEnrollments } from './enrollment.seed.js';
import { getSeedCounts } from './seed-utils.js';

async function main(): Promise<void> {
  await connectMongo();
  const institutionId = process.env.SEED_INSTITUTION_ID;
  if (!institutionId) {
    throw new Error('SEED_INSTITUTION_ID is required');
  }
  const institutionOid = new Types.ObjectId(institutionId);

  const admin =
    (await UserModel.findOne({ institutionId: institutionOid }).select('_id').lean()) ??
    (await UserModel.findOne().select('_id').lean());
  if (!admin) {
    throw new Error('No user found to use as createdBy');
  }
  const userId = String(admin._id);
  const userOid = new Types.ObjectId(userId);
  const counts = getSeedCounts();

  // Campus — required: institutionId, name, code
  let campus = await CampusModel.findOne({ institutionId: institutionOid, deletedAt: null }).lean();
  if (!campus) {
    const created = await CampusModel.create({
      institutionId: institutionOid,
      name: 'Main Campus',
      code: 'MAIN',
      status: 'active',
      deletedAt: null,
    });
    campus = created.toObject();
    logger.info({ id: String(campus._id) }, 'Created campus');
  }
  const campusId = String(campus._id);

  // School — required: institutionId, name, code (no campusId on model)
  let school = await SchoolModel.findOne({ institutionId: institutionOid, deletedAt: null }).lean();
  if (!school) {
    const created = await SchoolModel.create({
      institutionId: institutionOid,
      name: 'School of Engineering',
      code: 'SOE',
      status: 'active',
      deletedAt: null,
    });
    school = created.toObject();
    logger.info({ id: String(school._id) }, 'Created school');
  }
  const schoolId = String(school._id);

  // Departments — required: institutionId, schoolId, name, code
  const deptSpecs = [
    { name: 'Computer Science', code: 'CSE' },
    { name: 'Electronics', code: 'ECE' },
    { name: 'Mechanical', code: 'ME' },
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Business', code: 'BBA' },
  ];
  const departmentIds: string[] = [];
  for (const spec of deptSpecs.slice(0, counts.departments)) {
    let dept = await DepartmentModel.findOne({
      institutionId: institutionOid,
      code: spec.code,
      deletedAt: null,
    }).lean();
    if (!dept) {
      const created = await DepartmentModel.create({
        institutionId: institutionOid,
        schoolId: school._id,
        name: spec.name,
        code: spec.code,
        status: 'active',
        deletedAt: null,
      });
      dept = created.toObject();
    }
    departmentIds.push(String(dept._id));
  }

  // Programs — required: institutionId, departmentId, name, code, durationYears, credits, level
  const programSpecs = [
    {
      name: 'B.Tech CSE',
      code: 'BT-CSE',
      departmentIndex: 0,
      durationYears: 4,
      credits: 160,
      level: 'undergraduate' as const,
    },
    {
      name: 'B.Tech ECE',
      code: 'BT-ECE',
      departmentIndex: 1,
      durationYears: 4,
      credits: 160,
      level: 'undergraduate' as const,
    },
    {
      name: 'B.Tech ME',
      code: 'BT-ME',
      departmentIndex: 2,
      durationYears: 4,
      credits: 160,
      level: 'undergraduate' as const,
    },
    {
      name: 'B.Sc Mathematics',
      code: 'BS-MATH',
      departmentIndex: 3,
      durationYears: 3,
      credits: 120,
      level: 'undergraduate' as const,
    },
  ];
  const programIds: string[] = [];
  for (const spec of programSpecs.slice(0, counts.programs)) {
    let program = await ProgramModel.findOne({
      institutionId: institutionOid,
      code: spec.code,
      deletedAt: null,
    }).lean();
    if (!program) {
      const created = await ProgramModel.create({
        institutionId: institutionOid,
        departmentId: new Types.ObjectId(departmentIds[spec.departmentIndex]!),
        name: spec.name,
        code: spec.code,
        durationYears: spec.durationYears,
        credits: spec.credits,
        level: spec.level,
        status: 'active',
        deletedAt: null,
      });
      program = created.toObject();
    }
    programIds.push(String(program._id));
  }

  // Academic year — required: institutionId, name, startDate, endDate
  let year = await AcademicYearModel.findOne({
    institutionId: institutionOid,
    deletedAt: null,
  }).lean();
  if (!year) {
    const created = await AcademicYearModel.create({
      institutionId: institutionOid,
      name: '2025-2026',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2026-06-30'),
      isActive: true,
      status: 'active',
      deletedAt: null,
    });
    year = created.toObject();
  }
  const academicYearId = String(year._id);

  // Semesters — required: institutionId, academicYearId, name, number, term, startDate, endDate
  const semesterIds: string[] = [];
  for (let i = 1; i <= counts.semesters; i++) {
    let semester = await SemesterModel.findOne({
      institutionId: institutionOid,
      academicYearId: year._id,
      number: i,
      deletedAt: null,
    }).lean();
    if (!semester) {
      const term = i % 2 === 1 ? ('odd' as const) : ('even' as const);
      // Pair semesters into academic-year halves: odd = Jul–Dec, even = Jan–Jun
      const pair = Math.floor((i - 1) / 2);
      const semStart =
        term === 'odd' ? new Date(2025 + pair, 6, 1) : new Date(2026 + pair, 0, 1);
      const semEnd =
        term === 'odd'
          ? new Date(semStart.getFullYear(), 11, 31)
          : new Date(semStart.getFullYear(), 5, 30);

      const created = await SemesterModel.create({
        institutionId: institutionOid,
        academicYearId: year._id,
        name: `Semester ${i}`,
        number: i,
        term,
        startDate: semStart,
        endDate: semEnd,
        status: 'active',
        deletedAt: null,
      });
      semester = created.toObject();
    }
    semesterIds.push(String(semester._id));
  }

  // Sections + batches
  // Section required: institutionId, programId, semesterId, name, capacity
  // Batch required: institutionId, programId, name, year
  const sectionIds: string[] = [];
  const batchIds: string[] = [];
  for (let i = 0; i < counts.sections; i++) {
    const programId = programIds[i % programIds.length]!;
    const semesterId = semesterIds[i % semesterIds.length]!;
    const sectionName = `Section ${String.fromCharCode(65 + i)}`;

    let section = await SectionModel.findOne({
      institutionId: institutionOid,
      programId: new Types.ObjectId(programId),
      semesterId: new Types.ObjectId(semesterId),
      name: sectionName,
      deletedAt: null,
    }).lean();
    if (!section) {
      const created = await SectionModel.create({
        institutionId: institutionOid,
        programId: new Types.ObjectId(programId),
        semesterId: new Types.ObjectId(semesterId),
        name: sectionName,
        capacity: 60,
        status: 'active',
        deletedAt: null,
      });
      section = created.toObject();
    }
    sectionIds.push(String(section._id));

    const batchYear = 2025;
    let batch = await BatchModel.findOne({
      institutionId: institutionOid,
      programId: new Types.ObjectId(programId),
      year: batchYear,
      deletedAt: null,
    }).lean();
    if (!batch) {
      const created = await BatchModel.create({
        institutionId: institutionOid,
        programId: new Types.ObjectId(programId),
        name: `Batch ${batchYear}-${String.fromCharCode(65 + i)}`,
        year: batchYear,
        status: 'active',
        deletedAt: null,
      });
      batch = created.toObject();
    }
    batchIds.push(String(batch._id));
  }

  // Faculty — required: employeeId, facultyCode, institutionId, firstName, lastName, fullName, email, designation, employmentType
  let facultyCount = await FacultyModel.countDocuments({
    institutionId: institutionOid,
    deletedAt: null,
  });
  const facultyIds = (
    await FacultyModel.find({ institutionId: institutionOid, deletedAt: null })
      .select('_id')
      .lean()
  ).map((d) => String(d._id));

  while (facultyCount < counts.faculty) {
    const n = facultyCount + 1;
    const firstName = 'Faculty';
    const lastName = `${n}`;
    const created = await FacultyModel.create({
      institutionId: institutionOid,
      campusId: new Types.ObjectId(campusId),
      schoolId: new Types.ObjectId(schoolId),
      departmentId: new Types.ObjectId(departmentIds[n % departmentIds.length]!),
      employeeId: `FAC-${String(n).padStart(4, '0')}`,
      facultyCode: `FC-${String(n).padStart(4, '0')}`,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: `faculty.seed.${n}@learnova.test`,
      designation: 'assistant_professor',
      employmentType: 'full_time',
      status: 'active',
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: null,
    });
    facultyIds.push(String(created._id));
    facultyCount += 1;
  }

  // Students — required: studentId, admissionNumber, institutionId, firstName, lastName, fullName, email
  let studentCount = await StudentModel.countDocuments({
    institutionId: institutionOid,
    deletedAt: null,
  });
  const studentIds = (
    await StudentModel.find({ institutionId: institutionOid, deletedAt: null })
      .select('_id')
      .lean()
  ).map((d) => String(d._id));

  while (studentCount < counts.students) {
    const n = studentCount + 1;
    const firstName = 'Student';
    const lastName = `${n}`;
    const created = await StudentModel.create({
      institutionId: institutionOid,
      campusId: new Types.ObjectId(campusId),
      schoolId: new Types.ObjectId(schoolId),
      departmentId: new Types.ObjectId(departmentIds[n % departmentIds.length]!),
      programId: new Types.ObjectId(programIds[n % programIds.length]!),
      academicYearId: new Types.ObjectId(academicYearId),
      semesterId: new Types.ObjectId(semesterIds[n % semesterIds.length]!),
      sectionId: new Types.ObjectId(sectionIds[n % sectionIds.length]!),
      batchId: new Types.ObjectId(batchIds[n % batchIds.length]!),
      studentId: `STU-${String(n).padStart(5, '0')}`,
      admissionNumber: `ADM-${String(n).padStart(5, '0')}`,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: `student.seed.${n}@learnova.test`,
      status: 'active',
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: null,
    });
    studentIds.push(String(created._id));
    studentCount += 1;
  }

  // Courses (ensure ≥30)
  let courseCount = await CourseModel.countDocuments({
    institutionId: institutionOid,
    deletedAt: null,
  });
  const courseIds = (
    await CourseModel.find({ institutionId: institutionOid, deletedAt: null })
      .select('_id')
      .lean()
  ).map((d) => String(d._id));

  const categories = [
    'programming',
    'cyber_security',
    'ai',
    'cloud',
    'networking',
    'database',
    'electronics',
    'mechanical',
    'mathematics',
    'general',
  ] as const;

  while (courseCount < counts.courses) {
    const n = courseCount + 1;
    const title = `Seed Course ${n}`;
    const created = await CourseModel.create({
      institutionId: institutionOid,
      campusId: new Types.ObjectId(campusId),
      schoolId: new Types.ObjectId(schoolId),
      departmentId: new Types.ObjectId(departmentIds[n % departmentIds.length]!),
      programIds: [new Types.ObjectId(programIds[n % programIds.length]!)],
      semesterIds: [new Types.ObjectId(semesterIds[n % semesterIds.length]!)],
      facultyIds: [new Types.ObjectId(facultyIds[n % facultyIds.length]!)],
      coordinatorId: new Types.ObjectId(facultyIds[n % facultyIds.length]!),
      courseCode: `SEED-${String(n).padStart(3, '0')}`,
      slug: `seed-course-${n}`,
      title,
      shortDescription: `Seeded course ${n}`,
      category: categories[n % categories.length],
      difficulty: 'beginner',
      language: 'en',
      credits: 3,
      estimatedHours: 40,
      status: 'published',
      visibility: 'institution',
      enrollmentMode: n % 4 === 0 ? 'approval' : n % 5 === 0 ? 'closed' : 'open',
      maxStudents: 40,
      waitlistEnabled: true,
      createdBy: userOid,
      updatedBy: userOid,
      deletedAt: null,
    });
    courseIds.push(String(created._id));
    courseCount += 1;
  }

  logger.info(
    {
      departments: departmentIds.length,
      programs: programIds.length,
      faculty: facultyIds.length,
      students: studentIds.length,
      courses: courseIds.length,
      capacity: studentIds.length * courseIds.length,
    },
    'Enrollment stack ready',
  );

  // Always force-replace enrollments for this stack seed (clears bogus/partial data).
  logger.info('Forcing enrollment reseed with target %d', counts.enrollments);
  const result = await seedEnrollments(
    institutionId,
    {
      studentIds,
      courseIds,
      facultyIds,
      departmentIds,
      programIds,
      academicYearIds: [academicYearId],
      semesterIds,
      sectionIds,
      userId,
    },
    { force: true, target: counts.enrollments, waitlistTarget: counts.waitlist },
  );

  logger.info(result, 'Enrollment stack seed completed');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Enrollment stack seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
