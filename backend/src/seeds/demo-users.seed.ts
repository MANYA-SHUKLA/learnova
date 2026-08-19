/**
 * Demo users seed - creates demo login accounts for faculty and student roles
 * 
 * Passwords:
 * - faculty.demo@learnova.test: Demo@12345
 * - student.demo@learnova.test: Demo@12345
 * 
 * Requires: SEED_INSTITUTION_ID env variable
 * Usage: pnpm seed:demo
 */

import { Types } from 'mongoose';
import { provisionLoginUser } from '../services/users/provision-login-user.js';
import { FacultyModel } from '../models/faculty.model.js';
import { StudentModel } from '../models/student.model.js';
import { logger } from '../utils/logger/index.js';
import { getSeedCounts } from './seed-utils.js';

const DEMO_PASSWORD = 'Demo@12345';

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
      email: 'faculty.demo@learnova.test',
      firstName: 'Faculty',
      lastName: 'Demo',
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
      email: 'student.demo@learnova.test',
      firstName: 'Student',
      lastName: 'Demo',
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
    const facultyUser = await provisionLoginUser({
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      institutionId,
      role: 'faculty',
      password: DEMO_PASSWORD,
      mustChangePassword: false,
    });

    const facultyRecord = await FacultyModel.findOneAndUpdate(
      { email: account.email, institutionId: instOid },
      {
        $setOnInsert: {
          employeeId: account.employeeId,
          facultyCode: account.facultyCode,
          firstName: account.firstName,
          lastName: account.lastName,
          fullName: `${account.firstName} ${account.lastName}`,
          email: account.email,
          designation: 'assistant_professor',
          employmentType: 'full_time',
          institutionId: instOid,
          status: 'active',
          isActive: true,
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
    const studentUser = await provisionLoginUser({
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      institutionId,
      role: 'student',
      password: DEMO_PASSWORD,
      mustChangePassword: false,
    });

    const studentRecord = await StudentModel.findOneAndUpdate(
      { email: account.email, institutionId: instOid },
      {
        $setOnInsert: {
          studentId: account.studentId,
          admissionNumber: account.admissionNumber,
          rollNumber: account.rollNumber,
          firstName: account.firstName,
          lastName: account.lastName,
          fullName: `${account.firstName} ${account.lastName}`,
          email: account.email,
          institutionId: instOid,
          status: 'active',
          isActive: true,
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
