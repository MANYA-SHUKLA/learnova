/**
 * Set demo student Gunjan to B.Tech CSE Sem VII / Year 4 and sync semester enrollments.
 * Usage: pnpm exec tsx --env-file=.env src/scripts/set-gunjan-semester.ts
 */

import { Types } from 'mongoose';
import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { CourseModel } from '../models/course.model.js';
import { EnrollmentModel } from '../models/enrollment.model.js';
import { SectionModel } from '../models/section.model.js';
import { SemesterModel } from '../models/semester.model.js';
import { StudentModel } from '../models/student.model.js';
import { STUDENT_LOGIN_EMAIL } from '../seeds/monsoon-2026/constants.js';
import {
  computeExpectedGraduationDate,
  DEFAULT_PROGRAM_DURATION_YEARS,
} from '@learnova/utils';
import { logger } from '../utils/logger/index.js';

const SECTION_NAME = 'B.Tech CSE Sem VII';
const SEMESTER_NUMBER = 7;
const YEAR_OF_STUDY = 4;

async function main(): Promise<void> {
  await connectMongo();

  const student = await StudentModel.findOne({
    email: STUDENT_LOGIN_EMAIL.toLowerCase(),
    deletedAt: null,
  }).exec();
  if (!student) {
    throw new Error(`Student not found: ${STUDENT_LOGIN_EMAIL}`);
  }

  const institutionId = String(student.institutionId);
  const institutionOid = new Types.ObjectId(institutionId);

  const semester = await SemesterModel.findOne({
    institutionId: institutionOid,
    number: SEMESTER_NUMBER,
    deletedAt: null,
  })
    .select('_id academicYearId')
    .lean()
    .exec();
  if (!semester) {
    throw new Error(`Semester ${SEMESTER_NUMBER} not found for institution ${institutionId}`);
  }

  const section = await SectionModel.findOne({
    institutionId: institutionOid,
    name: SECTION_NAME,
    deletedAt: null,
  })
    .select('_id programId departmentId')
    .lean()
    .exec();
  if (!section) {
    throw new Error(`Section "${SECTION_NAME}" not found — run seed:monsoon-2026 first`);
  }

  const programDuration = student.programDuration ?? DEFAULT_PROGRAM_DURATION_YEARS;
  const admissionDate = student.admissionDate ?? new Date('2022-07-01');
  const expectedGraduationDate = computeExpectedGraduationDate({
    yearOfStudy: YEAR_OF_STUDY,
    programDuration,
    admissionDate,
  });

  await StudentModel.updateOne(
    { _id: student._id },
    {
      $set: {
        sectionId: section._id,
        semesterId: semester._id,
        programId: section.programId,
        departmentId: section.departmentId,
        academicYearId: semester.academicYearId ?? student.academicYearId,
        yearOfStudy: YEAR_OF_STUDY,
        currentSemester: SEMESTER_NUMBER,
        expectedGraduationDate,
        programDuration,
      },
    },
  ).exec();

  const courses = await CourseModel.find({
    institutionId: institutionOid,
    programIds: section.programId,
    semesterIds: semester._id,
    status: 'published',
    deletedAt: null,
  })
    .select('_id')
    .lean()
    .exec();

  let enrollmentsUpserted = 0;
  for (const course of courses) {
    const result = await EnrollmentModel.findOneAndUpdate(
      {
        institutionId: institutionOid,
        studentId: student._id,
        courseId: course._id,
        deletedAt: null,
      },
      {
        $set: {
          departmentId: section.departmentId,
          programId: section.programId,
          academicYearId: semester.academicYearId ?? student.academicYearId,
          semesterId: semester._id,
          sectionId: section._id,
          status: 'active',
          approvalStatus: 'approved',
        },
        $setOnInsert: {
          enrollmentNumber: `ENR-GUN-S7-${String(enrollmentsUpserted + 1).padStart(3, '0')}`,
          completionStatus: 'not_started',
          enrollmentMethod: 'manual',
          enrollmentDate: new Date(),
        },
      },
      { upsert: true, setDefaultsOnInsert: true, new: true },
    ).exec();
    if (result) enrollmentsUpserted += 1;
  }

  logger.info(
    {
      email: STUDENT_LOGIN_EMAIL,
      section: SECTION_NAME,
      semesterNumber: SEMESTER_NUMBER,
      yearOfStudy: YEAR_OF_STUDY,
      catalogCourses: courses.length,
      enrollmentsUpserted,
    },
    'Gunjan academic term updated',
  );

  console.log(
    JSON.stringify({
      ok: true,
      email: STUDENT_LOGIN_EMAIL,
      yearOfStudy: YEAR_OF_STUDY,
      currentSemester: SEMESTER_NUMBER,
      section: SECTION_NAME,
      enrollments: enrollmentsUpserted,
    }),
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
