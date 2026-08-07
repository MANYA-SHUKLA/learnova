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

const DEMO_PASSWORD = 'Demo@12345';

interface DemoSeedResult {
  facultyUserId: string;
  facultyRecordId: string;
  studentUserId: string;
  studentRecordId: string;
}

export async function seedDemoUsers(institutionId: string): Promise<DemoSeedResult> {
  const instOid = new Types.ObjectId(institutionId);
  
  // Provision faculty login user
  logger.info('Provisioning faculty demo login user...');
  const facultyUser = await provisionLoginUser({
    email: 'faculty.demo@learnova.test',
    firstName: 'Faculty',
    lastName: 'Demo',
    institutionId,
    role: 'faculty',
    password: DEMO_PASSWORD,
    mustChangePassword: false,
  });
  
  // Create or update faculty ERP record
  logger.info('Creating/updating faculty demo ERP record...');
  const facultyRecord = await FacultyModel.findOneAndUpdate(
    { email: 'faculty.demo@learnova.test', institutionId: instOid },
    {
      $setOnInsert: {
        employeeId: 'FAC-DEMO-001',
        facultyCode: 'FDEMO001',
        firstName: 'Faculty',
        lastName: 'Demo',
        fullName: 'Faculty Demo',
        email: 'faculty.demo@learnova.test',
        designation: 'assistant_professor',
        employmentType: 'full_time',
        institutionId: instOid,
        status: 'active',
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  
  // Provision student login user
  logger.info('Provisioning student demo login user...');
  const studentUser = await provisionLoginUser({
    email: 'student.demo@learnova.test',
    firstName: 'Student',
    lastName: 'Demo',
    institutionId,
    role: 'student',
    password: DEMO_PASSWORD,
    mustChangePassword: false,
  });
  
  // Create or update student ERP record
  logger.info('Creating/updating student demo ERP record...');
  const studentRecord = await StudentModel.findOneAndUpdate(
    { email: 'student.demo@learnova.test', institutionId: instOid },
    {
      $setOnInsert: {
        studentId: 'STU-DEMO-001',
        admissionNumber: 'ADM2026001',
        rollNumber: 'ROLL2026001',
        firstName: 'Student',
        lastName: 'Demo',
        fullName: 'Student Demo',
        email: 'student.demo@learnova.test',
        institutionId: instOid,
        status: 'active',
        isActive: true,
        yearOfStudy: 1,
        currentSemester: 1,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  
  logger.info(
    {
      faculty: {
        userId: facultyUser.userId,
        recordId: String(facultyRecord._id),
        created: facultyUser.created,
      },
      student: {
        userId: studentUser.userId,
        recordId: String(studentRecord._id),
        created: studentUser.created,
      },
    },
    'Demo users seeded successfully',
  );
  
  return {
    facultyUserId: facultyUser.userId,
    facultyRecordId: String(facultyRecord._id),
    studentUserId: studentUser.userId,
    studentRecordId: String(studentRecord._id),
  };
}
