/**
 * SOE JNU — Monsoon semester 2026 timetables, faculty, courses, and demo logins.
 *
 * Usage: pnpm --filter @learnova/backend seed:monsoon-2026
 */

import '../config/load-env.js';
import { Types } from 'mongoose';
import {
  AcademicYearModel,
  BatchModel,
  CourseModel,
  DepartmentModel,
  EnrollmentModel,
  FacultyModel,
  ProgramModel,
  SchoolModel,
  SectionModel,
  SemesterModel,
  StudentModel,
  TimetableModel,
  TimetableSlotModel,
} from '../models/index.js';
import {
  computeExpectedGraduationDate,
  DEFAULT_PROGRAM_DURATION_YEARS,
} from '@learnova/utils';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { hashPassword } from '../security/index.js';
import { userRepository } from '../repositories/auth/index.js';
import { provisionLoginUser } from '../services/users/provision-login-user.js';
import { logger } from '../utils/logger/index.js';
import { archiveLegacyYearSections } from '../services/institution/archive-legacy-year-sections.js';
import { mergeJointTimetableSlots } from '../services/institution/merge-joint-timetable-slots.js';
import { pruneMinimalOrgStructure } from '../services/institution/prune-minimal-org-structure.js';
import { syncSemesterCalendar } from '../services/institution/sync-semester-calendar.js';
import { ensureMonsoonDemoSectionStudents } from '../services/institution/ensure-monsoon-demo-students.js';
import { syncTimetableSectionEnrollments } from '../services/institution/sync-timetable-section-enrollments.js';
import { seedInstitutionAdminUser } from './institution-admin.seed.js';
import {
  COURSE_TITLES,
  DEMO_PASSWORD,
  FACULTY_BY_CODE,
  FACULTY_LOGIN_EMAIL,
  MONSOON_PERIODS,
  STUDENT_LOGIN_EMAIL,
  type RawSlot,
  type SectionPlan,
} from './monsoon-2026/constants.js';
import { BTECH_SECTION_PLANS, SECTION_PLANS } from './monsoon-2026/schedules.js';

const activeSectionPlans =
  process.env.SEED_MONSOON_ALL_PROGRAMS === '1' ? SECTION_PLANS : BTECH_SECTION_PLANS;

const ACADEMIC_YEAR_NAME = '2026-2027';

const ALL_PROGRAM_SPECS = [
  { code: 'BT-CSE', name: 'B.Tech CSE', department: 'CSE', durationYears: 4, level: 'undergraduate' as const },
  { code: 'BT-ECE', name: 'B.Tech ECE', department: 'ECE', durationYears: 4, level: 'undergraduate' as const },
  { code: 'MT-CSE', name: 'M.Tech CSE', department: 'CSE', durationYears: 2, level: 'postgraduate' as const },
  { code: 'MT-ECE', name: 'M.Tech ECE', department: 'ECE', durationYears: 2, level: 'postgraduate' as const },
  { code: 'MT-MST', name: 'M.Tech MST', department: 'ECE', durationYears: 2, level: 'postgraduate' as const },
  { code: 'PHD', name: 'Ph.D', department: 'CSE', durationYears: 4, level: 'doctoral' as const },
];

const PROGRAM_SPECS =
  process.env.SEED_MONSOON_ALL_PROGRAMS === '1'
    ? ALL_PROGRAM_SPECS
    : ALL_PROGRAM_SPECS.filter((p) => p.code.startsWith('BT-'));

function courseCodeFromKey(key: string): string {
  const base = key.replace(/\s*\(.*\)$/, '').replace(/\s*—.*$/, '').trim();
  return base.split(/\s+/)[0] ?? key;
}

function courseTitle(key: string): string {
  return COURSE_TITLES[key] ?? key;
}

async function ensurePassword(
  email: string,
  firstName: string,
  lastName: string,
  role: 'faculty' | 'student' | 'institution_admin',
  institutionId: string,
): Promise<void> {
  if (role === 'institution_admin') {
    const user = await userRepository.findByEmail(email);
    if (!user) return;
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    await userRepository.updateById(String(user._id), {
      passwordHash,
      mustChangePassword: false,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    return;
  }

  const provisioned = await provisionLoginUser({
    email,
    firstName,
    lastName,
    institutionId,
    role,
    password: DEMO_PASSWORD,
    mustChangePassword: false,
  });
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await userRepository.updateById(provisioned.userId, {
    passwordHash,
    mustChangePassword: false,
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
  });
}

async function main(): Promise<void> {
  const institutionId = process.env.SEED_INSTITUTION_ID?.trim();
  if (!institutionId) throw new Error('SEED_INSTITUTION_ID required');

  await connectMongo();
  const institutionOid = new Types.ObjectId(institutionId);

  await seedInstitutionAdminUser(institutionId);

  const departments = new Map<string, Types.ObjectId>();
  const departmentSpecs = [
    { code: 'CSE', name: 'Computer Science' },
    { code: 'ECE', name: 'Electronics' },
    ...(process.env.SEED_MONSOON_ALL_PROGRAMS === '1'
      ? [
          { code: 'MATH', name: 'Mathematics' },
          { code: 'PHD', name: 'Ph.D.' },
        ]
      : []),
  ];
  for (const spec of departmentSpecs) {
    let dept = await DepartmentModel.findOne({
      institutionId: institutionOid,
      code: spec.code,
      deletedAt: null,
    }).lean();
    if (!dept) {
      const school =
        (await SchoolModel.findOne({ institutionId: institutionOid, deletedAt: null }).lean()) ??
        (await DepartmentModel.findOne({ institutionId: institutionOid, deletedAt: null })
          .select('schoolId')
          .lean());
      const schoolId =
        school && '_id' in school && !('schoolId' in school)
          ? school._id
          : (school as { schoolId?: Types.ObjectId })?.schoolId;
      if (!schoolId) throw new Error('No school — run seed:enrollment-stack');
      const created = await DepartmentModel.create({
        institutionId: institutionOid,
        schoolId,
        name: spec.name,
        code: spec.code,
        status: 'active',
        deletedAt: null,
      });
      dept = created.toObject();
    }
    departments.set(spec.code, dept._id);
  }

  const programs = new Map<string, { id: Types.ObjectId; departmentId: Types.ObjectId }>();
  for (const spec of PROGRAM_SPECS) {
    const departmentId = departments.get(spec.department)!;
    let program = await ProgramModel.findOne({
      institutionId: institutionOid,
      code: spec.code,
      deletedAt: null,
    }).lean();
    if (!program) {
      const created = await ProgramModel.create({
        institutionId: institutionOid,
        departmentId,
        name: spec.name,
        code: spec.code,
        durationYears: spec.durationYears,
        credits: spec.level === 'doctoral' ? 0 : 120,
        level: spec.level,
        status: 'active',
        deletedAt: null,
      });
      program = created.toObject();
      logger.info({ code: spec.code }, 'Created program');
    }
    programs.set(spec.code, { id: program._id, departmentId });
  }

  let year = await AcademicYearModel.findOne({
    institutionId: institutionOid,
    name: ACADEMIC_YEAR_NAME,
    deletedAt: null,
  }).lean();
  if (!year) {
    const created = await AcademicYearModel.create({
      institutionId: institutionOid,
      name: ACADEMIC_YEAR_NAME,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-06-30'),
      isActive: true,
      status: 'active',
      deletedAt: null,
    });
    year = created.toObject();
  } else {
    await AcademicYearModel.updateOne(
      { _id: year._id },
      { $set: { isActive: true, status: 'active', startDate: new Date('2026-07-01'), endDate: new Date('2027-06-30') } },
    );
  }

  await AcademicYearModel.updateMany(
    { institutionId: institutionOid, _id: { $ne: year._id }, deletedAt: null },
    { $set: { isActive: false } },
  );

  const semesterNumbers = [...new Set(activeSectionPlans.map((p) => p.semesterNumber))].sort(
    (a, b) => a - b,
  );
  const semesterByNumber = new Map<number, { id: Types.ObjectId; name: string }>();

  for (const number of semesterNumbers) {
    let semester = await SemesterModel.findOne({
      institutionId: institutionOid,
      academicYearId: year._id,
      number,
      deletedAt: null,
    }).lean();
    const term = number % 2 === 1 ? 'odd' : 'even';
    const pair = Math.floor((number - 1) / 2);
    const semStart = term === 'odd' ? new Date(2026 + pair, 6, 1) : new Date(2027 + pair, 0, 1);
    const semEnd =
      term === 'odd'
        ? new Date(semStart.getFullYear(), 11, 31)
        : new Date(semStart.getFullYear(), 4, 31);
    const name = `Monsoon 2026 — Semester ${number}`;

    if (!semester) {
      const created = await SemesterModel.create({
        institutionId: institutionOid,
        academicYearId: year._id,
        name,
        number,
        term,
        startDate: semStart,
        endDate: semEnd,
        status: 'active',
        deletedAt: null,
      });
      semester = created.toObject();
    } else {
      await SemesterModel.updateOne(
        { _id: semester._id },
        { $set: { name, term, startDate: semStart, endDate: semEnd, status: 'active' } },
      );
    }
    semesterByNumber.set(number, { id: semester._id, name });
  }

  const facultyByCode = new Map<string, { id: Types.ObjectId; fullName: string }>();
  let facultyIndex = 0;
  for (const [code, meta] of Object.entries(FACULTY_BY_CODE)) {
    facultyIndex += 1;
    const email =
      code === 'KR' ? FACULTY_LOGIN_EMAIL : `${code.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@learnova.test`;
    const deptKey = meta.department === 'MATH' ? 'CSE' : meta.department;
    const deptId = departments.get(deptKey)!;
    const faculty = await FacultyModel.findOneAndUpdate(
      { institutionId: institutionOid, email },
      {
        $set: {
          firstName: meta.firstName,
          lastName: meta.lastName,
          fullName: meta.fullName,
          departmentId: deptId,
          designation: code === 'KR' ? 'professor' : 'assistant_professor',
          employmentType: 'full_time',
          isActive: true,
          status: 'active',
          deletedAt: null,
        },
        $setOnInsert: {
          employeeId: `FAC-M26-${String(facultyIndex).padStart(3, '0')}`,
          facultyCode: `M26-${code}`,
          institutionId: institutionOid,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    facultyByCode.set(code, { id: faculty._id, fullName: meta.fullName });

    if (code === 'KR') {
      await ensurePassword(email, meta.firstName, meta.lastName, 'faculty', institutionId);
    }
  }

  const courseCache = new Map<string, Types.ObjectId>();

  async function ensureCourse(code: string, title: string, programCode: string, semesterNumber: number): Promise<Types.ObjectId> {
    const normalizedCode = code.toUpperCase();
    const program = programs.get(programCode)!;
    const semester = semesterByNumber.get(semesterNumber)!;
    const slug = `${normalizedCode}-${programCode}-s${semesterNumber}`.toLowerCase();

    let course = await CourseModel.findOne({
      institutionId: institutionOid,
      courseCode: normalizedCode,
      deletedAt: null,
    }).lean();

    if (!course) {
      const created = await CourseModel.create({
        institutionId: institutionOid,
        departmentId: program.departmentId,
        programIds: [program.id],
        semesterIds: [semester.id],
        courseCode: normalizedCode,
        title,
        slug,
        credits: title.toLowerCase().includes('lab') ? 2 : 3,
        category: 'general',
        status: 'published',
        deletedAt: null,
      });
      course = created.toObject();
    } else {
      await CourseModel.updateOne(
        { _id: course._id },
        {
          $set: { title, status: 'published' },
          $addToSet: { semesterIds: semester.id, programIds: program.id },
        },
      );
    }
    courseCache.set(normalizedCode, course._id);
    return course._id;
  }

  const sectionCache = new Map<string, Types.ObjectId>();

  async function ensureSection(plan: SectionPlan): Promise<Types.ObjectId> {
    const cached = sectionCache.get(plan.sectionLabel);
    if (cached) return cached;

    const program = programs.get(plan.programCode)!;
    const semester = semesterByNumber.get(plan.semesterNumber)!;
    const section = await SectionModel.findOneAndUpdate(
      {
        institutionId: institutionOid,
        name: plan.sectionLabel,
        deletedAt: null,
      },
      {
        $set: {
          programId: program.id,
          semesterId: semester.id,
          capacity: 60,
          status: 'active',
        },
        $setOnInsert: {
          institutionId: institutionOid,
          name: plan.sectionLabel,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    sectionCache.set(plan.sectionLabel, section._id);
    return section._id;
  }

  const slotsBySemester = new Map<number, SectionPlan[]>();
  for (const plan of activeSectionPlans) {
    const list = slotsBySemester.get(plan.semesterNumber) ?? [];
    list.push(plan);
    slotsBySemester.set(plan.semesterNumber, list);
  }

  for (const [semesterNumber, plans] of slotsBySemester) {
    const semester = semesterByNumber.get(semesterNumber)!;
    const timetableName = `School of Engineering, JNU — Monsoon semester 2026 (Sem ${semesterNumber})`;

    let timetable = await TimetableModel.findOne({
      institutionId: institutionOid,
      semesterId: semester.id,
      deletedAt: null,
    }).lean();

    if (timetable) {
      await TimetableSlotModel.deleteMany({ timetableId: timetable._id });
      await TimetableModel.updateOne(
        { _id: timetable._id },
        {
          $set: {
            name: timetableName,
            status: 'published',
            publishedAt: new Date(),
            academicYearId: year._id,
          },
        },
      );
    } else {
      const created = await TimetableModel.create({
        institutionId: institutionOid,
        semesterId: semester.id,
        academicYearId: year._id,
        name: timetableName,
        status: 'published',
        publishedAt: new Date(),
        deletedAt: null,
      });
      timetable = created.toObject();
    }

    const slotDocs: Array<Record<string, unknown>> = [];

    for (const plan of plans) {
      const sectionId = await ensureSection(plan);
      for (const entry of plan.slots) {
        const [day, periodIndex, courseKey, facultyCode, room] = entry as RawSlot;
        const period = MONSOON_PERIODS[periodIndex];
        if (!period) continue;

        const code = courseCodeFromKey(courseKey);
        const title = courseTitle(courseKey);
        const courseId = await ensureCourse(code, title, plan.programCode, plan.semesterNumber);
        const faculty = facultyByCode.get(facultyCode);
        if (!faculty) {
          logger.warn({ facultyCode, courseKey }, 'Unknown faculty code — skipped slot');
          continue;
        }

        const slotPayload = {
          institutionId: institutionOid,
          semesterId: semester.id,
          timetableId: timetable._id,
          dayOfWeek: day,
          startTime: period.startTime,
          endTime: period.endTime,
          courseId,
          courseTitle: `${code}: ${title}`,
          sectionId,
          sectionName: plan.sectionLabel,
          facultyId: faculty.id,
          facultyName: faculty.fullName,
          room,
          status: 'active' as const,
          deletedAt: null,
        };
        const mergeKey = `${day}|${period.startTime}|${period.endTime}|${faculty.id}|${String(courseId)}|${room.trim().toLowerCase()}`;
        const existing = slotDocs.find(
          (row) =>
            `${row.dayOfWeek}|${row.startTime}|${row.endTime}|${row.facultyId}|${String(row.courseId)}|${String(row.room).trim().toLowerCase()}` ===
            mergeKey,
        );
        if (existing) {
          if (String(existing.sectionId) === String(sectionId)) {
            continue;
          }
          const combined = [String(existing.sectionName), plan.sectionLabel]
            .flatMap((s) => s.split(' + '))
            .map((s) => s.trim())
            .filter(Boolean);
          const mergedName = [...new Set(combined)].sort().join(' + ');
          existing.sectionName = mergedName;
          slotDocs.push({ ...slotPayload, sectionName: mergedName });
          continue;
        }
        slotDocs.push(slotPayload);
      }
    }

    if (slotDocs.length > 0) {
      await TimetableSlotModel.insertMany(slotDocs);
    }
    logger.info({ semesterNumber, slots: slotDocs.length, timetableId: String(timetable._id) }, 'Timetable seeded');
  }

  const cseSem7Section = sectionCache.get('B.Tech CSE Sem VII');
  if (cseSem7Section) {
    const sem7 = semesterByNumber.get(7)!;
    const cseProgram = programs.get('BT-CSE')!;
    const cseDepartmentId = departments.get('CSE')!;

    let cseBatch = await BatchModel.findOne({
      institutionId: institutionOid,
      programId: cseProgram.id,
      name: 'B.Tech CSE',
      deletedAt: null,
    }).lean();
    if (!cseBatch) {
      cseBatch = (
        await BatchModel.create({
          institutionId: institutionOid,
          programId: cseProgram.id,
          name: 'B.Tech CSE',
          year: 2022,
          status: 'active',
          deletedAt: null,
        })
      ).toObject();
    }

    const programDuration = DEFAULT_PROGRAM_DURATION_YEARS;
    const expectedGraduationDate = computeExpectedGraduationDate({
      yearOfStudy: 4,
      programDuration,
      admissionDate: new Date('2022-07-01'),
    });

    const gunjanStudent = await StudentModel.findOneAndUpdate(
      { institutionId: institutionOid, email: STUDENT_LOGIN_EMAIL, deletedAt: null },
      {
        $set: {
          firstName: 'Gunjan',
          lastName: 'Gera',
          fullName: 'Gunjan Gera',
          sectionId: cseSem7Section,
          semesterId: sem7.id,
          academicYearId: year._id,
          programId: cseProgram.id,
          departmentId: cseDepartmentId,
          batchId: cseBatch._id,
          programDuration,
          expectedGraduationDate,
          yearOfStudy: 4,
          currentSemester: 7,
          isActive: true,
          status: 'active',
        },
        $setOnInsert: {
          institutionId: institutionOid,
          studentId: 'STU-M26-001',
          admissionNumber: 'ADM-M26-001',
          rollNumber: 'ROLL-M26-001',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await ensurePassword(STUDENT_LOGIN_EMAIL, 'Gunjan', 'Gera', 'student', institutionId);

    const sem7Courses = await CourseModel.find({
      institutionId: institutionOid,
      semesterIds: sem7.id,
      programIds: cseProgram.id,
      status: 'published',
      deletedAt: null,
    })
      .select('_id')
      .lean();
    const defaultFacultyId = facultyByCode.get('KR')?.id ?? null;

    for (let index = 0; index < sem7Courses.length; index++) {
      const courseId = sem7Courses[index]!._id;
      await EnrollmentModel.findOneAndUpdate(
        {
          institutionId: institutionOid,
          studentId: gunjanStudent._id,
          courseId,
          deletedAt: null,
        },
        {
          $set: {
            departmentId: cseDepartmentId,
            programId: cseProgram.id,
            academicYearId: year._id,
            semesterId: sem7.id,
            sectionId: cseSem7Section,
            facultyId: defaultFacultyId,
            status: 'active',
            approvalStatus: 'approved',
            completionStatus: 'not_started',
            enrollmentMethod: 'manual',
            enrollmentDate: new Date(),
          },
          $setOnInsert: {
            enrollmentNumber: `ENR-M26-S7-${String(index + 1).padStart(3, '0')}`,
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );
    }
    logger.info({ enrollments: sem7Courses.length }, 'Demo student Sem VII enrollments ensured');
  }

  await ensureMonsoonDemoSectionStudents(institutionId);

  // Odd Monsoon term active; archive M.Tech/Ph.D clutter when seeding B.Tech-only.
  await syncSemesterCalendar(institutionId, new Date('2026-09-15T12:00:00+05:30'));
  await archiveLegacyYearSections(institutionId);
  if (process.env.SEED_MONSOON_ALL_PROGRAMS !== '1') {
    await pruneMinimalOrgStructure(institutionId);
  }
  const merged = await mergeJointTimetableSlots(institutionId);
  logger.info({ mergedJointSlots: merged }, 'Post-seed timetable merge');

  const timetableEnrollments = await syncTimetableSectionEnrollments(institutionId);
  logger.info(timetableEnrollments, 'Timetable section enrollments synced');

  logger.info('Monsoon 2026 seed complete');
  logger.info(`  Admin: (institution admin email) / ${DEMO_PASSWORD}`);
  logger.info(`  Faculty (Dr. Krishnan Rajkumar): ${FACULTY_LOGIN_EMAIL} / ${DEMO_PASSWORD}`);
  logger.info(`  Student (B.Tech CSE Sem VII): ${STUDENT_LOGIN_EMAIL} / ${DEMO_PASSWORD}`);

  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  console.error(err);
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
