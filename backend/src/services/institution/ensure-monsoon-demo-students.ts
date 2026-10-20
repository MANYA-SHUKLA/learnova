import { Types } from 'mongoose';
import {
  AcademicYearModel,
  DepartmentModel,
  ProgramModel,
  SectionModel,
  SemesterModel,
  StudentModel,
} from '../../models/index.js';
import { hashPassword } from '../../security/index.js';
import { userRepository } from '../../repositories/auth/index.js';
import { provisionLoginUser } from '../users/provision-login-user.js';
import { logger } from '../../utils/logger/index.js';

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'Pass1234';

async function ensureLogin(
  email: string,
  firstName: string,
  lastName: string,
  institutionId: string,
): Promise<void> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    await userRepository.updateById(String(existing._id), { passwordHash, mustChangePassword: false });
    return;
  }
  await provisionLoginUser({
    email,
    firstName,
    lastName,
    role: 'student',
    institutionId,
    passwordHash,
    isEmailVerified: true,
  });
}

/** Ensures demo students exist in Monsoon timetable sections (e.g. Sem V for EN451). */
export async function ensureMonsoonDemoSectionStudents(institutionId: string): Promise<void> {
  const institutionOid = new Types.ObjectId(institutionId);
  const year = await AcademicYearModel.findOne({
    institutionId: institutionOid,
    name: '2026-2027',
    deletedAt: null,
  }).lean();
  if (!year) return;

  const program = await ProgramModel.findOne({
    institutionId: institutionOid,
    code: 'BT-CSE',
    deletedAt: null,
  }).lean();
  const department = await DepartmentModel.findOne({
    institutionId: institutionOid,
    code: 'CSE',
    deletedAt: null,
  }).lean();
  const sem5 = await SemesterModel.findOne({
    institutionId: institutionOid,
    academicYearId: year._id,
    number: 5,
    deletedAt: null,
  }).lean();
  const sem5Section = await SectionModel.findOne({
    institutionId: institutionOid,
    name: 'B.Tech CSE Sem V',
    deletedAt: null,
  }).lean();

  if (!program || !department || !sem5 || !sem5Section) {
    logger.warn('Monsoon demo Sem V prerequisites missing — skipped');
    return;
  }

  const sem5Email = 'cse.sem5.demo@soe.jnu.test';
  await StudentModel.findOneAndUpdate(
    { institutionId: institutionOid, email: sem5Email, deletedAt: null },
    {
      $set: {
        firstName: 'Riya',
        lastName: 'Kapoor',
        fullName: 'Riya Kapoor',
        sectionId: sem5Section._id,
        semesterId: sem5._id,
        academicYearId: year._id,
        programId: program._id,
        departmentId: department._id,
        yearOfStudy: 3,
        currentSemester: 5,
        isActive: true,
        status: 'active',
      },
      $setOnInsert: {
        institutionId: institutionOid,
        studentId: 'STU-M26-S5-001',
        admissionNumber: 'ADM-M26-S5-001',
        rollNumber: 'ROLL-M26-S5-001',
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  ).exec();
  await ensureLogin(sem5Email, 'Riya', 'Kapoor', institutionId);
  logger.info({ email: sem5Email }, 'Monsoon Sem V demo student ensured');
}
