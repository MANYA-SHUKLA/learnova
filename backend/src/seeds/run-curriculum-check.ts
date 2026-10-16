/**
 * Four-year curriculum for the two branches, CSE and ECE.
 * Five subjects per semester, one lab each. Faculty belong to a department and
 * share a year's subjects. A subject taught to both CSE and ECE is one class.
 * One student login, in CSE Year 1.
 *
 * Usage: pnpm seed:curriculum
 */

import '../config/load-env.js';
import { Types } from 'mongoose';
import {
  CourseModel,
  DepartmentModel,
  EnrollmentModel,
  FacultyModel,
  ProgramModel,
  SectionModel,
  SemesterModel,
  StudentModel,
  TimetableModel,
  TimetableSlotModel,
  UserModel,
} from '../models/index.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { hashPassword } from '../security/index.js';
import { roleRepository, userRepository } from '../repositories/auth/index.js';
import { provisionLoginUser } from '../services/users/provision-login-user.js';
import {
  DEFAULT_PERIODS,
  DEFAULT_WORKING_DAYS,
  sessionsPerWeek,
  settleTimetable,
  type CourseRecord,
  type FacultyRecord,
  type OccupiedSlot,
  type SectionRecord,
} from '../services/timetable/timetable-settler.js';

const CHECK_PASSWORD = 'Learnova@2026';
const FACULTY_EMAIL = 'faculty.year1@learnova.test';
const STUDENT_EMAIL = 'student.year1@learnova.test';

type Subject = {
  code: string;
  title: string;
  credits: number;
  category: string;
  lab?: boolean;
};

const YEARS: Array<{ year: number; odd: Subject[]; even: Subject[] }> = [
  {
    year: 1,
    odd: [
      { code: 'CSE101', title: 'Engineering Mathematics I', credits: 4, category: 'mathematics' },
      { code: 'CSE102', title: 'Programming for Problem Solving', credits: 3, category: 'programming' },
      { code: 'CSE103', title: 'Applied Physics', credits: 3, category: 'general' },
      { code: 'CSE104', title: 'Basic Electrical Engineering', credits: 3, category: 'electronics' },
      { code: 'CSE105', title: 'Programming Lab', credits: 2, category: 'programming', lab: true },
    ],
    even: [
      { code: 'CSE201', title: 'Engineering Mathematics II', credits: 4, category: 'mathematics' },
      { code: 'CSE202', title: 'Data Structures', credits: 3, category: 'programming' },
      { code: 'CSE203', title: 'Digital Logic', credits: 3, category: 'electronics' },
      { code: 'CSE204', title: 'Professional Communication', credits: 2, category: 'general' },
      { code: 'CSE205', title: 'Data Structures Lab', credits: 2, category: 'programming', lab: true },
    ],
  },
  {
    year: 2,
    odd: [
      { code: 'CSE301', title: 'Discrete Mathematics', credits: 4, category: 'mathematics' },
      { code: 'CSE302', title: 'Object Oriented Programming', credits: 3, category: 'programming' },
      { code: 'CSE303', title: 'Computer Organization', credits: 3, category: 'general' },
      { code: 'CSE304', title: 'Database Management Systems', credits: 3, category: 'database' },
      { code: 'CSE305', title: 'Database Lab', credits: 2, category: 'database', lab: true },
    ],
    even: [
      { code: 'CSE401', title: 'Design and Analysis of Algorithms', credits: 4, category: 'programming' },
      { code: 'CSE402', title: 'Operating Systems', credits: 3, category: 'general' },
      { code: 'CSE403', title: 'Computer Networks', credits: 3, category: 'networking' },
      { code: 'CSE404', title: 'Software Engineering', credits: 3, category: 'general' },
      { code: 'CSE405', title: 'Algorithms Lab', credits: 2, category: 'programming', lab: true },
    ],
  },
  {
    year: 3,
    odd: [
      { code: 'CSE501', title: 'Theory of Computation', credits: 4, category: 'general' },
      { code: 'CSE502', title: 'Machine Learning', credits: 3, category: 'ai' },
      { code: 'CSE503', title: 'Compiler Design', credits: 3, category: 'programming' },
      { code: 'CSE504', title: 'Web Technologies', credits: 3, category: 'programming' },
      { code: 'CSE505', title: 'Machine Learning Lab', credits: 2, category: 'ai', lab: true },
    ],
    even: [
      { code: 'CSE601', title: 'Artificial Intelligence', credits: 3, category: 'ai' },
      { code: 'CSE602', title: 'Information Security', credits: 3, category: 'cyber_security' },
      { code: 'CSE603', title: 'Cloud Computing', credits: 3, category: 'cloud' },
      { code: 'CSE604', title: 'Mobile Application Development', credits: 3, category: 'programming' },
      { code: 'CSE605', title: 'Security Lab', credits: 2, category: 'cyber_security', lab: true },
    ],
  },
  {
    year: 4,
    odd: [
      { code: 'CSE701', title: 'Distributed Systems', credits: 3, category: 'cloud' },
      { code: 'CSE702', title: 'Big Data Analytics', credits: 3, category: 'database' },
      { code: 'CSE703', title: 'Deep Learning', credits: 3, category: 'ai' },
      { code: 'CSE704', title: 'Project Seminar', credits: 2, category: 'general' },
      { code: 'CSE705', title: 'Big Data Lab', credits: 2, category: 'database', lab: true },
    ],
    even: [
      { code: 'CSE801', title: 'Internet of Things', credits: 3, category: 'electronics' },
      { code: 'CSE802', title: 'Natural Language Processing', credits: 3, category: 'ai' },
      { code: 'CSE803', title: 'Ethics and Intellectual Property', credits: 2, category: 'general' },
      { code: 'CSE804', title: 'Major Project', credits: 4, category: 'general' },
      { code: 'CSE805', title: 'IoT Lab', credits: 2, category: 'electronics', lab: true },
    ],
  },
];

const ECE_YEARS: Array<{ year: number; odd: Subject[]; even: Subject[] }> = [
  {
    year: 1,
    odd: [
      { code: 'ECE101', title: 'Engineering Mathematics I', credits: 4, category: 'mathematics' },
      { code: 'ECE102', title: 'Electronic Devices', credits: 3, category: 'electronics' },
      { code: 'ECE103', title: 'Circuit Theory', credits: 3, category: 'electronics' },
      { code: 'ECE104', title: 'Engineering Physics', credits: 3, category: 'general' },
      { code: 'ECE105', title: 'Circuits Lab', credits: 2, category: 'electronics', lab: true },
    ],
    even: [
      { code: 'ECE201', title: 'Engineering Mathematics II', credits: 4, category: 'mathematics' },
      { code: 'ECE202', title: 'Signals and Systems', credits: 3, category: 'electronics' },
      { code: 'ECE203', title: 'Analog Electronics', credits: 3, category: 'electronics' },
      { code: 'ECE204', title: 'Network Analysis', credits: 3, category: 'electronics' },
      { code: 'ECE205', title: 'Analog Electronics Lab', credits: 2, category: 'electronics', lab: true },
    ],
  },
  {
    year: 2,
    odd: [
      { code: 'ECE301', title: 'Electromagnetic Theory', credits: 4, category: 'electronics' },
      { code: 'ECE302', title: 'Microprocessors', credits: 3, category: 'electronics' },
      { code: 'ECE303', title: 'Analog Communication', credits: 3, category: 'electronics' },
      { code: 'ECE304', title: 'Control Systems', credits: 3, category: 'electronics' },
      { code: 'ECE305', title: 'Microprocessor Lab', credits: 2, category: 'electronics', lab: true },
    ],
    even: [
      { code: 'ECE401', title: 'Digital Communication', credits: 3, category: 'electronics' },
      { code: 'ECE402', title: 'VLSI Design', credits: 3, category: 'electronics' },
      { code: 'ECE403', title: 'Linear Integrated Circuits', credits: 3, category: 'electronics' },
      { code: 'ECE404', title: 'Probability and Random Processes', credits: 4, category: 'mathematics' },
      { code: 'ECE405', title: 'Communication Lab', credits: 2, category: 'electronics', lab: true },
    ],
  },
  {
    year: 3,
    odd: [
      { code: 'ECE501', title: 'Embedded Systems', credits: 3, category: 'electronics' },
      { code: 'ECE502', title: 'Digital Signal Processing', credits: 3, category: 'electronics' },
      { code: 'ECE503', title: 'Antennas and Wave Propagation', credits: 3, category: 'electronics' },
      { code: 'ECE504', title: 'Computer Networks', credits: 3, category: 'networking' },
      { code: 'ECE505', title: 'DSP Lab', credits: 2, category: 'electronics', lab: true },
    ],
    even: [
      { code: 'ECE601', title: 'Wireless Communication', credits: 3, category: 'electronics' },
      { code: 'ECE602', title: 'CMOS VLSI', credits: 3, category: 'electronics' },
      { code: 'ECE603', title: 'Microwave Engineering', credits: 3, category: 'electronics' },
      { code: 'ECE604', title: 'Optical Communication', credits: 3, category: 'electronics' },
      { code: 'ECE605', title: 'VLSI Lab', credits: 2, category: 'electronics', lab: true },
    ],
  },
  {
    year: 4,
    odd: [
      { code: 'ECE701', title: 'Sensor Networks', credits: 3, category: 'electronics' },
      { code: 'ECE702', title: 'Machine Learning for Signals', credits: 3, category: 'ai' },
      { code: 'ECE703', title: 'Satellite Communication', credits: 3, category: 'electronics' },
      { code: 'ECE704', title: 'ECE Project Seminar', credits: 2, category: 'general' },
      { code: 'ECE705', title: 'Embedded Systems Lab', credits: 2, category: 'electronics', lab: true },
    ],
    even: [
      { code: 'ECE801', title: 'Robotics and Automation', credits: 3, category: 'electronics' },
      { code: 'ECE802', title: 'Information Theory and Coding', credits: 3, category: 'electronics' },
      { code: 'ECE803', title: 'Professional Ethics', credits: 2, category: 'general' },
      { code: 'ECE804', title: 'ECE Major Project', credits: 4, category: 'general' },
      { code: 'ECE805', title: 'Robotics Lab', credits: 2, category: 'electronics', lab: true },
    ],
  },
];

type FacultyPlan = {
  branch: 'CSE' | 'ECE';
  email: string;
  firstName: string;
  lastName: string;
};

/** Department pools. A teacher is not locked to one year or one term. */
const FACULTY_PLAN: FacultyPlan[] = [
  { branch: 'CSE', email: FACULTY_EMAIL, firstName: 'Ananya', lastName: 'Rao' },
  { branch: 'CSE', email: 'faculty.year2.odd@learnova.test', firstName: 'Rohan', lastName: 'Iyer' },
  { branch: 'CSE', email: 'faculty.year3.odd@learnova.test', firstName: 'Meera', lastName: 'Nair' },
  { branch: 'CSE', email: 'faculty.year4.odd@learnova.test', firstName: 'Vikram', lastName: 'Shah' },
  { branch: 'CSE', email: 'faculty.year1.even@learnova.test', firstName: 'Kavya', lastName: 'Menon' },
  { branch: 'CSE', email: 'faculty.year2.even@learnova.test', firstName: 'Arjun', lastName: 'Das' },
  { branch: 'CSE', email: 'faculty.year3.even@learnova.test', firstName: 'Neha', lastName: 'Kapoor' },
  { branch: 'CSE', email: 'faculty.year4.even@learnova.test', firstName: 'Suresh', lastName: 'Patel' },
  { branch: 'ECE', email: 'faculty.ece.year1@learnova.test', firstName: 'Priya', lastName: 'Krishnan' },
  { branch: 'ECE', email: 'faculty.ece.year2.odd@learnova.test', firstName: 'Karthik', lastName: 'Reddy' },
  { branch: 'ECE', email: 'faculty.ece.year3.odd@learnova.test', firstName: 'Divya', lastName: 'Joshi' },
  { branch: 'ECE', email: 'faculty.ece.year4.odd@learnova.test', firstName: 'Amit', lastName: 'Verma' },
  { branch: 'ECE', email: 'faculty.ece.year1.even@learnova.test', firstName: 'Lakshmi', lastName: 'Nair' },
  { branch: 'ECE', email: 'faculty.ece.year2.even@learnova.test', firstName: 'Rahul', lastName: 'Ghosh' },
  { branch: 'ECE', email: 'faculty.ece.year3.even@learnova.test', firstName: 'Sneha', lastName: 'Kulkarni' },
  { branch: 'ECE', email: 'faculty.ece.year4.even@learnova.test', firstName: 'Imran', lastName: 'Qureshi' },
];

const BRANCHES = [
  { branch: 'CSE' as const, departmentCode: 'CSE', programCode: 'BT-CSE', years: YEARS },
  { branch: 'ECE' as const, departmentCode: 'ECE', programCode: 'BT-ECE', years: ECE_YEARS },
];

function slugify(code: string, title: string): string {
  return `${code}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function sharedTitleKey(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function setLoginPassword(email: string, firstName: string, lastName: string, role: 'faculty' | 'student', institutionId: string) {
  const provisioned = await provisionLoginUser({
    email,
    firstName,
    lastName,
    institutionId,
    role,
    password: CHECK_PASSWORD,
    mustChangePassword: false,
  });
  const passwordHash = await hashPassword(CHECK_PASSWORD);
  await userRepository.updateById(provisioned.userId, {
    passwordHash,
    mustChangePassword: false,
    isActive: true,
    isEmailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
  });
}

async function main(): Promise<void> {
  const institutionId = process.env.SEED_INSTITUTION_ID?.trim();
  if (!institutionId) throw new Error('SEED_INSTITUTION_ID required');
  const institutionOid = new Types.ObjectId(institutionId);

  await connectMongo();

  const semesters = await SemesterModel.find({ institutionId: institutionOid, deletedAt: null }).lean();
  const branchRecords = new Map<string, { departmentId: Types.ObjectId; programId: Types.ObjectId }>();
  for (const branch of BRANCHES) {
    const [department, program] = await Promise.all([
      DepartmentModel.findOne({ institutionId: institutionOid, code: branch.departmentCode, deletedAt: null }).lean(),
      ProgramModel.findOne({ institutionId: institutionOid, code: branch.programCode, deletedAt: null }).lean(),
    ]);
    if (!department || !program) {
      throw new Error(`${branch.branch} department or program missing`);
    }
    branchRecords.set(branch.branch, { departmentId: department._id, programId: program._id });
  }
  const cse = branchRecords.get('CSE')!;

  const semesterByNumber = new Map(semesters.map((row) => [row.number, row]));
  for (const number of [1, 2, 3, 4, 5, 6, 7, 8]) {
    if (!semesterByNumber.has(number)) throw new Error(`Semester ${number} missing`);
  }

  const facultyEmails = FACULTY_PLAN.map((row) => row.email);
  await FacultyModel.updateMany(
    { institutionId: institutionOid, email: { $nin: facultyEmails }, deletedAt: null },
    { $set: { isActive: false, status: 'archived' } },
  );

  const teachers: Array<{ id: string; name: string; branch: 'CSE' | 'ECE'; departmentId: string }> = [];
  const branchCounts = new Map<string, number>();
  for (const plan of FACULTY_PLAN) {
    const fullName = `${plan.firstName} ${plan.lastName}`;
    const branch = branchRecords.get(plan.branch)!;
    const index = (branchCounts.get(plan.branch) ?? 0) + 1;
    branchCounts.set(plan.branch, index);
    const code = `${plan.branch}-${String(index).padStart(2, '0')}`;
    const faculty = await FacultyModel.findOneAndUpdate(
      { institutionId: institutionOid, email: plan.email },
      {
        $set: {
          firstName: plan.firstName,
          lastName: plan.lastName,
          fullName,
          departmentId: branch.departmentId,
          programIds: [branch.programId],
          designation: plan.email === FACULTY_EMAIL ? 'associate_professor' : 'assistant_professor',
          employmentType: 'full_time',
          isActive: true,
          status: 'active',
          deletedAt: null,
        },
        $setOnInsert: {
          employeeId: `FAC-${code}`,
          facultyCode: code,
          institutionId: institutionOid,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    teachers.push({
      id: String(faculty._id),
      name: fullName,
      branch: plan.branch,
      departmentId: String(branch.departmentId),
    });
  }

  const curriculumCodes: string[] = [];
  const courseIdsByBranchSemester = new Map<string, string[]>();
  const courseIdsByTeacher = new Map<string, string[]>();
  const coordinatorByCourseId = new Map<string, string>();

  type Offering = {
    branch: 'CSE' | 'ECE';
    year: number;
    term: 'odd' | 'even';
    semesterNumber: number;
    subject: Subject;
  };
  const offerings: Offering[] = [];
  for (const branchPlan of BRANCHES) {
    for (const yearPlan of branchPlan.years) {
      for (const term of ['odd', 'even'] as const) {
        const semesterNumber = (yearPlan.year - 1) * 2 + (term === 'odd' ? 1 : 2);
        const subjects = term === 'odd' ? yearPlan.odd : yearPlan.even;
        for (const subject of subjects) {
          offerings.push({ branch: branchPlan.branch, year: yearPlan.year, term, semesterNumber, subject });
        }
      }
    }
  }

  const termLoad = new Map<string, number>();
  const semesterLoad = new Map<string, number>();
  const teacherByCourseCode = new Map<string, (typeof teachers)[number]>();

  const pickTeacher = (branch: 'CSE' | 'ECE', term: 'odd' | 'even', semesterNumber: number) => {
    const pool = teachers.filter((teacher) => teacher.branch === branch);
    const ranked = [...pool].sort((a, b) => {
      const semesterDiff =
        (semesterLoad.get(`${a.id}|${String(semesterNumber)}`) ?? 0) -
        (semesterLoad.get(`${b.id}|${String(semesterNumber)}`) ?? 0);
      if (semesterDiff !== 0) return semesterDiff;
      return (termLoad.get(`${a.id}|${term}`) ?? 0) - (termLoad.get(`${b.id}|${term}`) ?? 0);
    });
    const chosen = ranked[0];
    if (!chosen) throw new Error(`No ${branch} faculty available`);
    return chosen;
  };

  for (let semesterNumber = 1; semesterNumber <= 8; semesterNumber += 1) {
    const rows = offerings.filter((row) => row.semesterNumber === semesterNumber);
    const groups = new Map<string, Offering[]>();
    for (const row of rows) {
      const key = sharedTitleKey(row.subject.title);
      const list = groups.get(key) ?? [];
      list.push(row);
      groups.set(key, list);
    }
    for (const group of groups.values()) {
      const sample = group[0];
      if (!sample) continue;
      const branches = new Set(group.map((row) => row.branch));
      const teacher =
        branches.size > 1
          ? pickTeacher('CSE', sample.term, semesterNumber)
          : pickTeacher(sample.branch, sample.term, semesterNumber);
      const semesterKey = `${teacher.id}|${String(semesterNumber)}`;
      const termKey = `${teacher.id}|${sample.term}`;
      semesterLoad.set(semesterKey, (semesterLoad.get(semesterKey) ?? 0) + 1);
      termLoad.set(termKey, (termLoad.get(termKey) ?? 0) + sessionsPerWeek(sample.subject.credits));
      for (const row of group) teacherByCourseCode.set(row.subject.code, teacher);
    }
  }

  for (const branchPlan of BRANCHES) {
    const branch = branchRecords.get(branchPlan.branch)!;
    for (const yearPlan of branchPlan.years) {
      for (const term of ['odd', 'even'] as const) {
        const semesterNumber = (yearPlan.year - 1) * 2 + (term === 'odd' ? 1 : 2);
        const semester = semesterByNumber.get(semesterNumber)!;
        const subjects = term === 'odd' ? yearPlan.odd : yearPlan.even;
        const ids: string[] = [];

        for (const subject of subjects) {
          curriculumCodes.push(subject.code);
          const teacher = teacherByCourseCode.get(subject.code);
          if (!teacher) throw new Error(`No teacher for ${subject.code}`);
          const course = await CourseModel.findOneAndUpdate(
            { institutionId: institutionOid, courseCode: subject.code },
            {
              $set: {
                slug: slugify(subject.code, subject.title),
                title: subject.title,
                shortDescription: `${branchPlan.branch} Year ${yearPlan.year}, Semester ${semesterNumber}${subject.lab ? ' lab' : ''}.`,
                departmentId: branch.departmentId,
                programIds: [branch.programId],
                semesterIds: [semester._id],
                facultyIds: [new Types.ObjectId(teacher.id)],
                coordinatorId: new Types.ObjectId(teacher.id),
                category: subject.category,
                credits: subject.credits,
                status: 'published',
                visibility: 'institution',
                deletedAt: null,
              },
              $setOnInsert: {
                institutionId: institutionOid,
                courseCode: subject.code,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );
          const courseId = String(course._id);
          ids.push(courseId);
          coordinatorByCourseId.set(courseId, teacher.id);
          const taught = courseIdsByTeacher.get(teacher.id) ?? [];
          taught.push(courseId);
          courseIdsByTeacher.set(teacher.id, taught);
        }

        courseIdsByBranchSemester.set(`${branchPlan.branch}-${String(semesterNumber)}`, ids);
      }
    }
  }

  for (const teacher of teachers) {
    const ids = courseIdsByTeacher.get(teacher.id) ?? [];
    await FacultyModel.updateOne(
      { _id: new Types.ObjectId(teacher.id) },
      { $set: { courseIds: ids.map((id) => new Types.ObjectId(id)) } },
    );
  }

  await CourseModel.updateMany(
    {
      institutionId: institutionOid,
      courseCode: { $nin: curriculumCodes },
      deletedAt: null,
    },
    { $set: { status: 'archived', semesterIds: [], facultyIds: [], coordinatorId: null } },
  );

  const sem1 = semesterByNumber.get(1)!;
  for (const branchPlan of BRANCHES) {
    const branch = branchRecords.get(branchPlan.branch)!;
    for (let year = 1; year <= 4; year++) {
      for (const term of ['odd', 'even'] as const) {
        const semesterNumber = (year - 1) * 2 + (term === 'odd' ? 1 : 2);
        const semester = semesterByNumber.get(semesterNumber)!;
        const label = `${branchPlan.branch} Year ${year}`;
        const existing = await SectionModel.findOne({
          institutionId: institutionOid,
          programId: branch.programId,
          semesterId: semester._id,
          deletedAt: null,
          name: { $in: [`Year ${year}`, label] },
        });
        if (existing) {
          if (existing.name !== label) {
            existing.name = label;
            await existing.save();
          }
        } else {
          await SectionModel.create({
            institutionId: institutionOid,
            programId: branch.programId,
            semesterId: semester._id,
            name: label,
            capacity: 60,
            status: 'active',
            deletedAt: null,
          });
        }
      }
    }
  }
  const section = await SectionModel.findOne({
    institutionId: institutionOid,
    programId: cse.programId,
    semesterId: sem1._id,
    name: 'CSE Year 1',
    deletedAt: null,
  });
  if (!section) throw new Error('CSE Year 1 section missing');

  await StudentModel.updateMany(
    { institutionId: institutionOid, email: { $ne: STUDENT_EMAIL }, deletedAt: null },
    { $set: { isActive: false, status: 'inactive' } },
  );

  const student = await StudentModel.findOneAndUpdate(
    { institutionId: institutionOid, email: STUDENT_EMAIL },
    {
      $set: {
        firstName: 'Aarav',
        lastName: 'Mehta',
        fullName: 'Aarav Mehta',
        departmentId: cse.departmentId,
        programId: cse.programId,
        academicYearId: sem1.academicYearId,
        semesterId: sem1._id,
        sectionId: section._id,
        yearOfStudy: 1,
        currentSemester: 1,
        isActive: true,
        status: 'active',
        deletedAt: null,
      },
      $setOnInsert: {
        studentId: 'STU-Y1-001',
        admissionNumber: 'ADM-Y1-001',
        rollNumber: 'CSE2026001',
        institutionId: institutionOid,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const studentRole = await roleRepository.findByName('student');
  if (studentRole) {
    await UserModel.updateMany(
      { roleId: studentRole._id, email: { $ne: STUDENT_EMAIL }, institutionId: institutionOid },
      { $set: { isActive: false } },
    );
  }

  const checkFaculty = FACULTY_PLAN.find((row) => row.email === FACULTY_EMAIL)!;
  await setLoginPassword(FACULTY_EMAIL, checkFaculty.firstName, checkFaculty.lastName, 'faculty', institutionId);
  await setLoginPassword(STUDENT_EMAIL, 'Aarav', 'Mehta', 'student', institutionId);

  const sem1CourseIds = courseIdsByBranchSemester.get('CSE-1') ?? [];
  const fallbackTeacher = teachers[0];
  if (!fallbackTeacher) throw new Error('No faculty available');
  await EnrollmentModel.deleteMany({ institutionId: institutionOid, studentId: student._id });
  await EnrollmentModel.insertMany(
    sem1CourseIds.map((courseId, index) => ({
      studentId: student._id,
      courseId: new Types.ObjectId(courseId),
      institutionId: institutionOid,
      departmentId: cse.departmentId,
      programId: cse.programId,
      academicYearId: sem1.academicYearId,
      semesterId: sem1._id,
      sectionId: section!._id,
      facultyId: new Types.ObjectId(coordinatorByCourseId.get(courseId) ?? fallbackTeacher.id),
      enrollmentNumber: `ENR-Y1-${String(index + 1).padStart(2, '0')}`,
      enrollmentDate: new Date(),
      enrollmentMethod: 'manual',
      status: 'active',
      approvalStatus: 'approved',
      completionStatus: 'in_progress',
      deletedAt: null,
    })),
  );

  let occupied: OccupiedSlot[] = [];
  for (const semesterNumber of [7, 5, 3, 1]) {
    const semester = semesterByNumber.get(semesterNumber)!;
    const year = Math.ceil(semesterNumber / 2);
    const courseDocs = await CourseModel.find({
      institutionId: institutionOid,
      semesterIds: semester._id,
      status: 'published',
      deletedAt: null,
    }).lean();

    const courses: CourseRecord[] = courseDocs.map((doc) => ({
      id: String(doc._id),
      title: doc.title,
      credits: Number(doc.credits ?? 0),
      facultyIds: (doc.facultyIds ?? []).map(String),
      coordinatorId: doc.coordinatorId ? String(doc.coordinatorId) : null,
      programIds: (doc.programIds ?? []).map(String),
      departmentId: doc.departmentId ? String(doc.departmentId) : null,
      category: doc.category ?? null,
    }));
    const teachingIds = new Set(
      courses.flatMap((course) => [...course.facultyIds, ...(course.coordinatorId ? [course.coordinatorId] : [])]),
    );
    const faculty: FacultyRecord[] = teachers
      .filter((teacher) => teachingIds.has(teacher.id))
      .map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        departmentId: teacher.departmentId,
        specialization: null,
        courseIds: courses
          .filter((course) => course.facultyIds.includes(teacher.id) || course.coordinatorId === teacher.id)
          .map((course) => course.id),
      }));
    const sectionDocs = await SectionModel.find({
      institutionId: institutionOid,
      semesterId: semester._id,
      name: { $in: BRANCHES.map((branchPlan) => `${branchPlan.branch} Year ${year}`) },
      deletedAt: null,
    }).lean();
    const sections: SectionRecord[] = sectionDocs.map((row) => ({
      id: String(row._id),
      name: row.name,
      programId: String(row.programId),
    }));

    const settled = settleTimetable({
      courses,
      faculty,
      sections,
      workingDays: DEFAULT_WORKING_DAYS,
      periods: DEFAULT_PERIODS,
      occupied,
    });
    occupied = [
      ...occupied,
      ...settled.slots.map((slot) => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        facultyId: slot.facultyId,
        room: slot.room,
      })),
    ];

    const timetable = await TimetableModel.findOneAndUpdate(
      { institutionId: institutionOid, semesterId: semester._id, deletedAt: null },
      {
        $set: {
          academicYearId: semester.academicYearId,
          name: `Year ${year} · Semester ${semesterNumber} Timetable`,
          status: 'published',
          publishedAt: new Date(),
        },
        $setOnInsert: {
          institutionId: institutionOid,
          semesterId: semester._id,
          deletedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await TimetableSlotModel.deleteMany({ timetableId: timetable._id });
    if (settled.slots.length > 0) {
      await TimetableSlotModel.insertMany(
        settled.slots.map((slot) => ({
          timetableId: timetable._id,
          institutionId: institutionOid,
          semesterId: semester._id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          courseId: new Types.ObjectId(slot.courseId),
          courseTitle: slot.courseTitle,
          sectionId: new Types.ObjectId(slot.sectionId),
          sectionName: slot.sectionName,
          facultyId: new Types.ObjectId(slot.facultyId),
          facultyName: slot.facultyName,
          room: slot.room,
          status: 'active',
          deletedAt: null,
        })),
      );
    }
    const teacherNames = new Set(settled.slots.map((slot) => slot.facultyName));
    const unscheduled = settled.warnings.filter((warning) => warning.includes('left unscheduled'));
    console.log(
      `Year ${year} Semester ${semesterNumber}: ${courses.length} subjects, ${String(teacherNames.size)} teachers, ${String(settled.slots.length)} slots`,
    );
    for (const warning of unscheduled) console.log(`  ${warning}`);
  }

  console.log(
    JSON.stringify(
      {
        faculty: { email: FACULTY_EMAIL, password: CHECK_PASSWORD },
        student: { email: STUDENT_EMAIL, password: CHECK_PASSWORD },
      },
      null,
      2,
    ),
  );

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
