import { Types } from 'mongoose';
import { StudentModel } from '../models/student.model.js';
import { logger } from '../utils/logger/index.js';

const FIRST_NAMES = [
  'Aarav',
  'Vivaan',
  'Aditya',
  'Vihaan',
  'Arjun',
  'Sai',
  'Arnav',
  'Ayaan',
  'Krishna',
  'Ishaan',
  'Shaurya',
  'Atharv',
  'Advait',
  'Pranav',
  'Dhruv',
  'Ananya',
  'Diya',
  'Aadhya',
  'Avni',
  'Sara',
  'Anaya',
  'Pari',
  'Ira',
  'Myra',
  'Kavya',
  'Navya',
  'Saanvi',
  'Aanya',
  'Kiara',
  'Ishita',
  'Priya',
  'Neha',
  'Riya',
  'Tanya',
  'Sanya',
  'Aryan',
  'Rohan',
  'Karan',
  'Rahul',
  'Amit',
  'Raj',
  'Vikram',
  'Dev',
  'Nikhil',
  'Arun',
  'Varun',
  'Kartik',
  'Harsh',
  'Ayush',
  'Ravi',
];

const LAST_NAMES = [
  'Sharma',
  'Verma',
  'Kumar',
  'Singh',
  'Patel',
  'Reddy',
  'Gupta',
  'Joshi',
  'Rao',
  'Iyer',
  'Nair',
  'Mehta',
  'Shah',
  'Desai',
  'Agarwal',
  'Malhotra',
  'Kapoor',
  'Chopra',
  'Bansal',
  'Khanna',
  'Bose',
  'Mukherjee',
  'Chatterjee',
  'Das',
  'Roy',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['male', 'female', 'other'] as const;
const STATUSES = ['active', 'inactive', 'suspended', 'graduated', 'dropped'] as const;
const CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Kolkata',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
];
const STATES = [
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'West Bengal',
  'Telangana',
  'Rajasthan',
  'Gujarat',
  'Uttar Pradesh',
  'Kerala',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

function randomDate(startYear: number, endYear: number): Date {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

interface SeedRefs {
  campusIds: string[];
  schoolIds: string[];
  departmentIds: string[];
  programIds: string[];
  academicYearIds: string[];
  semesterIds: string[];
  sectionIds: string[];
  batchIds: string[];
}

/**
 * Seeds 200 realistic students across multiple departments, programs, sections, and batches.
 * @param institutionId The institution ID
 * @param refs References to campus, school, department, program, academic year, semester, section, and batch IDs
 */
export async function seedStudents(institutionId: string, refs: SeedRefs): Promise<void> {
  const instOid = new Types.ObjectId(institutionId);

  // Delete existing students for this institution
  const deleteResult = await StudentModel.deleteMany({ institutionId: instOid });
  logger.info({ institutionId, deleted: deleteResult.deletedCount }, 'Deleted existing students');

  const students: Array<Record<string, unknown>> = [];
  const usedEmails = new Set<string>();
  const usedStudentIds = new Set<string>();
  const usedAdmissionNumbers = new Set<string>();

  // Generate 200 students
  for (let i = 0; i < 200; i++) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;

    // Generate unique identifiers
    let studentId: string;
    let admissionNumber: string;
    let email: string;

    do {
      const year = 2024 - randomInt(0, 3); // Students from 2021-2024
      const num = String(i + 1).padStart(4, '0');
      studentId = `STU-${year}-${num}`;
      admissionNumber = `ADM-${year}-${num}`;
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@student.edu`;
    } while (
      usedStudentIds.has(studentId) ||
      usedAdmissionNumbers.has(admissionNumber) ||
      usedEmails.has(email)
    );

    usedStudentIds.add(studentId);
    usedAdmissionNumbers.add(admissionNumber);
    usedEmails.add(email);

    const departmentId = randomItem(refs.departmentIds);
    const programId = randomItem(refs.programIds);
    const academicYearId = randomItem(refs.academicYearIds);
    const semesterId = randomItem(refs.semesterIds);
    const sectionId = randomItem(refs.sectionIds);
    const batchId = randomItem(refs.batchIds);
    const campusId = randomItem(refs.campusIds);
    const schoolId = randomItem(refs.schoolIds);

    const gender = randomItem(GENDERS);
    const yearOfStudy = randomInt(1, 4);
    const currentSemester = yearOfStudy * 2 - (randomBool() ? 0 : 1);
    const status = i < 180 ? 'active' : randomItem(STATUSES); // 90% active
    const scholarship = randomBool(0.3); // 30% scholarship
    const hostelResident = randomBool(0.4); // 40% hostel
    const transportRequired = randomBool(0.2); // 20% transport

    const admissionDate = randomDate(2021, 2024);
    const dateOfBirth = randomDate(2000, 2006);
    const expectedGraduationYear = 2024 + (4 - yearOfStudy);
    const expectedGraduationDate = new Date(expectedGraduationYear, 5, 15);

    const city = randomItem(CITIES);
    const state = randomItem(STATES);

    students.push({
      studentId,
      admissionNumber,
      rollNumber: `ROLL-${String(i + 1).padStart(4, '0')}`,
      registrationNumber: randomBool(0.7) ? `REG-${String(i + 1).padStart(4, '0')}` : null,
      institutionId: instOid,
      campusId: new Types.ObjectId(campusId),
      schoolId: new Types.ObjectId(schoolId),
      departmentId: new Types.ObjectId(departmentId),
      programId: new Types.ObjectId(programId),
      academicYearId: new Types.ObjectId(academicYearId),
      semesterId: new Types.ObjectId(semesterId),
      sectionId: new Types.ObjectId(sectionId),
      batchId: new Types.ObjectId(batchId),
      firstName,
      lastName,
      fullName,
      email: email.toLowerCase(),
      alternateEmail: randomBool(0.3) ? `${firstName.toLowerCase()}alt@gmail.com` : null,
      phone: `+919${String(randomInt(100000000, 999999999))}`,
      alternatePhone: randomBool(0.2) ? `+918${String(randomInt(100000000, 999999999))}` : null,
      profilePhoto: null,
      gender,
      dateOfBirth,
      bloodGroup: randomItem(BLOOD_GROUPS),
      nationality: 'India',
      religion: randomBool(0.8) ? randomItem(['Hindu', 'Muslim', 'Christian', 'Sikh', 'Other']) : null,
      category: randomBool(0.7) ? randomItem(['General', 'OBC', 'SC', 'ST']) : null,
      address: randomBool(0.8) ? `${randomInt(1, 999)} Main Street, ${city}` : null,
      city,
      state,
      country: 'India',
      postalCode: String(randomInt(100000, 999999)),
      guardianName: randomBool(0.9) ? `Mr. ${lastName}` : null,
      guardianRelation: randomBool(0.9) ? 'Father' : null,
      guardianPhone: randomBool(0.9) ? `+919${String(randomInt(100000000, 999999999))}` : null,
      guardianEmail: randomBool(0.5) ? `${lastName.toLowerCase()}guardian@gmail.com` : null,
      emergencyContactName: randomBool(0.8) ? `Mrs. ${lastName}` : null,
      emergencyContactPhone: randomBool(0.8) ? `+918${String(randomInt(100000000, 999999999))}` : null,
      admissionDate,
      expectedGraduationDate,
      programDuration: 4,
      yearOfStudy,
      currentSemester,
      scholarship,
      hostelResident,
      transportRequired,
      bio: randomBool(0.4)
        ? `${yearOfStudy === 1 ? 'First' : yearOfStudy === 2 ? 'Second' : yearOfStudy === 3 ? 'Third' : 'Fourth'} year student interested in technology and innovation.`
        : null,
      linkedin: randomBool(0.3) ? `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}` : null,
      website: randomBool(0.1) ? `https://${firstName.toLowerCase()}${lastName.toLowerCase()}.dev` : null,
      isActive: status === 'active',
      status,
      createdBy: null,
      updatedBy: null,
      deletedAt: null,
      createdAt: admissionDate,
      updatedAt: admissionDate,
    });
  }

  // Bulk insert all students
  const result = await StudentModel.insertMany(students);
  logger.info(
    { institutionId, count: result.length },
    'Seeded students across departments and programs',
  );
}
