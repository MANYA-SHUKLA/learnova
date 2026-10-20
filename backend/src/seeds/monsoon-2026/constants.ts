import type { TimetableDayOfWeek } from '@learnova/types';

export const DEMO_PASSWORD = 'Pass1234';
export const FACULTY_LOGIN_EMAIL = 'krishnansir@gmail.com';
export const STUDENT_LOGIN_EMAIL = 'geragunjan02@gmail.com';

/** SOE JNU Monsoon 2026 grid (matches official notice). */
export const MONSOON_PERIODS = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
  { startTime: '12:00', endTime: '13:00' },
  { startTime: '14:15', endTime: '15:15' },
  { startTime: '15:15', endTime: '16:15' },
  { startTime: '16:15', endTime: '17:15' },
  { startTime: '17:15', endTime: '18:15' },
] as const;

export type MonsoonDay = TimetableDayOfWeek;

export type RawSlot = [MonsoonDay, number, string, string, string];

export const FACULTY_BY_CODE: Record<
  string,
  { firstName: string; lastName: string; fullName: string; department: 'CSE' | 'ECE' | 'MATH' }
> = {
  AKJ: { firstName: 'Ankit Kumar', lastName: 'Jaiswal', fullName: 'Dr. Ankit Kumar Jaiswal', department: 'CSE' },
  SV: { firstName: 'Shashank', lastName: 'Vadlamani', fullName: 'Dr. Shashank Vadlamani', department: 'MATH' },
  KK: { firstName: 'K Kranthi', lastName: 'Kumar', fullName: 'Dr. K Kranthi Kumar', department: 'ECE' },
  BS: { firstName: 'B.', lastName: 'Sangmesh', fullName: 'Dr. B. Sangmesh', department: 'CSE' },
  SR: { firstName: 'Sandesha', lastName: 'Rayapa', fullName: 'Dr. Sandesha Rayapa', department: 'ECE' },
  'AK/LKS': {
    firstName: 'Arvind',
    lastName: 'Kumar',
    fullName: 'Dr. Arvind Kumar / Dr. Lavish Kumar Singh',
    department: 'ECE',
  },
  LP: { firstName: 'Lakshmi', lastName: 'Priya', fullName: 'Dr. Lakshmi Priya', department: 'ECE' },
  DS: { firstName: 'Deepak', lastName: 'Sharma', fullName: 'Dr. Deepak Sharma', department: 'CSE' },
  RS: { firstName: 'Rituraj', lastName: 'Singh', fullName: 'Dr. Rituraj Singh', department: 'MATH' },
  AN: { firstName: 'Anupama', lastName: 'Namburu', fullName: 'Dr. Anupama Namburu', department: 'CSE' },
  BKR: { firstName: 'Benay Kumar', lastName: 'Ray', fullName: 'Dr. Benay Kumar Ray', department: 'CSE' },
  PS: { firstName: 'Pushpendra', lastName: 'Singh', fullName: 'Dr. Pushpendra Singh', department: 'ECE' },
  KR: { firstName: 'Krishnan', lastName: 'Rajkumar', fullName: 'Dr. Krishnan Rajkumar', department: 'CSE' },
  MKG: { firstName: 'Mukesh Kumar', lastName: 'Giluka', fullName: 'Dr. Mukesh Kumar Giluka', department: 'CSE' },
  AC: { firstName: 'Ankit', lastName: 'Chaudhary', fullName: 'Dr. Ankit Chaudhary', department: 'CSE' },
  JSK: { firstName: 'Jyoti Singh', lastName: 'Kirar', fullName: 'Dr. Jyoti Singh Kirar', department: 'CSE' },
  LKS: {
    firstName: 'Lavish Kumar',
    lastName: 'Singh',
    fullName: 'Dr. Lavish Kumar Singh',
    department: 'ECE',
  },
  'LKS / NEW FACULTY': {
    firstName: 'Lavish Kumar',
    lastName: 'Singh',
    fullName: 'Dr. Lavish Kumar Singh & New Faculty',
    department: 'ECE',
  },
  MS: {
    firstName: 'Mukuloth',
    lastName: 'Srinivasnaik',
    fullName: 'Dr. Mukuloth Srinivasnaik',
    department: 'MATH',
  },
  AB: { firstName: 'Ayushi', lastName: 'Barthwal', fullName: 'Dr. Ayushi Barthwal', department: 'ECE' },
  RD: { firstName: 'Renuka', lastName: 'Devi', fullName: 'Dr. Renuka Devi', department: 'ECE' },
  AKA: { firstName: 'Ashwini Kumar', lastName: 'Arya', fullName: 'Dr. Ashwini Kumar Arya', department: 'ECE' },
  GPS: { firstName: 'Gajendra Pratap', lastName: 'Singh', fullName: 'Dr. Gajendra Pratap Singh', department: 'CSE' },
  'SPS Faculty/LKS': {
    firstName: 'Lavish Kumar',
    lastName: 'Singh',
    fullName: 'SPS Faculty / Dr. Lavish Kumar Singh',
    department: 'ECE',
  },
};

export const COURSE_TITLES: Record<string, string> = {
  EN102: 'Environmental Studies',
  EN103: 'Engineering Mathematics-I (Calculus and Transform)',
  EN104N: 'Engineering Foundation-I (Computer Programming)',
  'EN104N LAB': 'Engineering Foundation-I (Computer Programming) — Lab',
  EN106M: 'Engineering Drawing & Visualization',
  'EN106M LAB': 'Engineering Drawing & Visualization — Lab',
  EN108N: 'English in Practice',
  EN110: 'Fibre Optic Communication',
  EN201: 'Physics',
  EN201N: 'Physics',
  'EN201N LAB (G- I)': 'Physics — Lab (Group I)',
  'EN201N LAB (G- II)': 'Physics — Lab (Group II)',
  'EN201 LAB (G- I)': 'Physics — Lab (Group I)',
  'EN201 LAB (G- II)': 'Physics — Lab (Group II)',
  'EN103 (Tut)': 'Engineering Mathematics-I — Tutorial',
  EN303: 'Digital Logic and Systems Design',
  'EN303 LAB': 'Digital Logic and Systems Design — Lab',
  EN307: 'Network Analysis and Synthesis',
  'EN307 (Tut)': 'Network Analysis and Synthesis — Tutorial',
  EN308: 'Engineering Foundation-III (Introduction to AI)',
  'EN308 (Tut)': 'Engineering Foundation-III — Tutorial',
  EN361: 'Operational Research',
  EN405: 'Data Base Management Systems',
  'EN405 LAB': 'Data Base Management Systems — Lab',
  EN408: 'Analog Electronics',
  'EN408 LAB': 'Analog Electronics — Lab',
  EN451: 'Theory of Computation',
  'EN451 (Tut)': 'Theory of Computation — Tutorial',
  EN452: 'Computer Networks',
  'EN452 (Tut)': 'Computer Networks — Tutorial',
  EN453: 'Software Engineering',
  'EN453 LAB': 'Software Engineering — Lab',
  EN469: 'Linear Algebra',
  'EN469 (Tut)': 'Linear Algebra — Tutorial',
  EN476: 'Object Oriented Programming with JAVA',
  'EN476 LAB': 'Object Oriented Programming with JAVA — Lab',
  EN478N: 'Professional Ethics and Technical Writing',
  EN501: 'Operating Systems',
  'EN501 LAB': 'Operating Systems — Lab',
  EN502: 'Machine Learning',
  'EN502 LAB': 'Machine Learning — Lab',
  EN510N: 'Electromagnetic Field Theory',
  'EN510N (Tut)': 'Electromagnetic Field Theory — Tutorial',
  EN511: 'Control Systems',
  'EN511 (Tut)': 'Control Systems — Tutorial',
  EN514M: 'Microprocessors',
  'EN514M LAB': 'Microprocessors — Lab',
  EN647: 'Parallel & Distributed Systems',
  EN705: 'Research Methodology',
  EN711: 'Mathematical Foundations for CSE',
  EN712: 'Machine Learning',
  EN713: 'Advanced Computer Networks',
  EN714: 'Advanced Database Management Systems',
  EN715: 'Advanced Operating Systems',
  EN740: 'Natural Language Processing',
  'EN740 LAB': 'Natural Language Processing — Lab',
  EN811: 'Mathematical Foundations for ECE',
  EN813: 'Advanced Control Systems',
  EN814: 'Analog Integrated Circuits',
  EN815: 'RF and Microwave Components',
  EN911: 'Mathematical Foundations for Material Science & Technology',
  EN912: 'Structure and Characterization of Materials',
  EN913: 'Thermodynamics and Kinetics',
  EN934: 'Selection and Manufacturing of Engineering Materials',
  EN936: 'Advanced Engineering Materials',
  EN717: 'Academic Ethics and Technical Writing',
};

export type SectionPlan = {
  sectionLabel: string;
  programCode: string;
  semesterNumber: number;
  slots: RawSlot[];
};
