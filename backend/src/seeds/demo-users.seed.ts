/**
 * Demo users seed - creates demo login accounts for faculty and student roles
 *
 * Requires: SEED_INSTITUTION_ID env variable
 * Usage: pnpm seed:demo
 */

import { Types } from 'mongoose';
import { hashPassword } from '../security/index.js';
import { userRepository } from '../repositories/auth/index.js';
import {
  provisionLoginUser,
  type ProvisionLoginUserInput,
} from '../services/users/provision-login-user.js';
import { FacultyModel } from '../models/faculty.model.js';
import { StudentModel } from '../models/student.model.js';
import { logger } from '../utils/logger/index.js';
import { getSeedCounts } from './seed-utils.js';

export const DEMO_FACULTY_EMAIL = 'noreply@moonair.in';
export const DEMO_FACULTY_PASSWORD = 'MANYAshukl@1';
export const DEMO_STUDENT_EMAIL = 'geragunjan02@gmail.com';
export const DEMO_STUDENT_PASSWORD = 'MANYAshukl@1';

const LEGACY_DEMO_PASSWORD = 'Demo@12345';

async function ensureLoginUser(input: ProvisionLoginUserInput): Promise<{
  userId: string;
  created: boolean;
}> {
  const result = await provisionLoginUser(input);
  if (!result.created && input.password) {
    const passwordHash = await hashPassword(input.password);
    await userRepository.updateById(result.userId, {
      passwordHash,
      mustChangePassword: input.mustChangePassword ?? false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }
  return { userId: result.userId, created: result.created };
}

export interface DemoSeedResult {
  facultyUserId: string;
  facultyRecordId: string;
  studentUserId: string;
  studentRecordId: string;
}

export async function seedDemoUsers(institutionId: string): Promise<DemoSeedResult> {
  const instOid = new Types.ObjectId(institutionId);
  const demoUsers = getSeedCounts().demoUsers;

  const demoAccounts = [
    {
      role: 'faculty' as const,
      email: DEMO_FACULTY_EMAIL,
      firstName: 'Faculty',
      lastName: 'Moonair',
      employeeId: 'FAC-DEMO-001',
      facultyCode: 'FDEMO001',
    },
    ...(demoUsers >= 2
      ? [
          {
            role: 'faculty' as const,
            email: 'faculty.demo2@learnova.test',
            firstName: 'Faculty',
            lastName: 'Demo Two',
            employeeId: 'FAC-DEMO-002',
            facultyCode: 'FDEMO002',
          },
        ]
      : []),
  ];

  const studentAccounts = [
    {
      email: DEMO_STUDENT_EMAIL,
      firstName: 'Gunjan',
      lastName: 'Gera',
      studentId: 'STU-DEMO-001',
      admissionNumber: 'ADM2026001',
      rollNumber: 'ROLL2026001',
    },
    ...(demoUsers >= 2
      ? [
          {
            email: 'student.demo2@learnova.test',
            firstName: 'Student',
            lastName: 'Demo Two',
            studentId: 'STU-DEMO-002',
            admissionNumber: 'ADM2026002',
            rollNumber: 'ROLL2026002',
          },
        ]
      : []),
  ];

  let facultyUserId = '';
  let facultyRecordId = '';
  for (const account of demoAccounts) {
    logger.info({ email: account.email }, 'Provisioning faculty demo login user...');
    const facultyPassword =
      account.email.toLowerCase() === DEMO_FACULTY_EMAIL.toLowerCase()
        ? DEMO_FACULTY_PASSWORD
        : LEGACY_DEMO_PASSWORD;
    const facultyUser = await ensureLoginUser({
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      institutionId,
      role: 'faculty',
      password: facultyPassword,
      mustChangePassword: false,
    });

    const facultyRecord = await FacultyModel.findOneAndUpdate(
      {
        institutionId: instOid,
        $or: [{ email: account.email }, { employeeId: account.employeeId }],
        deletedAt: null,
      },
      {
        $set: {
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          fullName: `${account.firstName} ${account.lastName}`,
          status: 'active',
          isActive: true,
        },
        $setOnInsert: {
          employeeId: account.employeeId,
          facultyCode: account.facultyCode,
          designation: 'assistant_professor',
          employmentType: 'full_time',
          institutionId: instOid,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    facultyUserId = facultyUser.userId;
    facultyRecordId = String(facultyRecord._id);
  }

  let studentUserId = '';
  let studentRecordId = '';
  for (const account of studentAccounts) {
    logger.info({ email: account.email }, 'Provisioning student demo login user...');
    const studentPassword =
      account.email.toLowerCase() === DEMO_STUDENT_EMAIL.toLowerCase()
        ? DEMO_STUDENT_PASSWORD
        : LEGACY_DEMO_PASSWORD;
    const studentUser = await ensureLoginUser({
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      institutionId,
      role: 'student',
      password: studentPassword,
      mustChangePassword: false,
    });

    const studentRecord = await StudentModel.findOneAndUpdate(
      {
        institutionId: instOid,
        $or: [{ email: account.email }, { studentId: account.studentId }],
        deletedAt: null,
      },
      {
        $set: {
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          fullName: `${account.firstName} ${account.lastName}`,
          status: 'active',
          isActive: true,
        },
        $setOnInsert: {
          studentId: account.studentId,
          admissionNumber: account.admissionNumber,
          rollNumber: account.rollNumber,
          institutionId: instOid,
          yearOfStudy: 1,
          currentSemester: 1,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    studentUserId = studentUser.userId;
    studentRecordId = String(studentRecord._id);
  }

  logger.info(
    {
      facultyAccounts: demoAccounts.length,
      studentAccounts: studentAccounts.length,
      facultyUserId,
      facultyRecordId,
      studentUserId,
      studentRecordId,
    },
    'Demo users seeded successfully',
  );

  return {
    facultyUserId,
    facultyRecordId,
    studentUserId,
    studentRecordId,
  };
}
