/**
 * JNU School of Engineering — Monsoon 2026 B.Tech timetable source of truth.
 * M.Tech / Ph.D are out of scope. Do not assign EN711 / EN714 without manual verification.
 */

import { JNU_MASTER_TIMETABLE_INSTRUCTIONS } from './jnu-master-instructions.js';

export const JNU_SOE_MONSOON_PERIODS = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
  { startTime: '12:00', endTime: '13:00' },
  { startTime: '14:15', endTime: '15:15' },
  { startTime: '15:15', endTime: '16:15' },
  { startTime: '16:15', endTime: '17:15' },
  { startTime: '17:15', endTime: '18:15' },
] as const;

export const JNU_SOE_WORKING_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;

/** Course codes that appeared without a clear B.Tech programme in the source extract. */
export const JNU_UNVERIFIED_COURSE_CODES = new Set(['EN711', 'EN714']);

/** Monsoon 2026 operational summary + full master instruction for AI. */
export const JNU_SOE_GENERATION_RULES = `${JNU_MASTER_TIMETABLE_INSTRUCTIONS}

Monsoon 2026 implementation notes:
- Official locked day/time/room/faculty grid is embedded from the uploaded timetable (seed schedules).
- Server settler preserves locked slots first, then fills remaining sessions without violating hard constraints.
- LMS AI step assigns faculty only; do not return invented slot times unless they match locked source rows.
- Do not assign EN711 or EN714 to B.Tech unless explicitly verified.
- Balance B.Tech CSE and B.Tech ECE weekly sessions per the official grid; never skew most classes to CSE only.
- Shared subjects at the same time/faculty/room are combined sessions (both section labels).
`.trim();

type CatalogRow = { code: string; subject: string; faculty: string };

export type JnuSemesterCatalog = {
  /** Same course code + faculty for both B.Tech CSE and B.Tech ECE — one combined class when time/room match. */
  shared: CatalogRow[];
  cseOnly: CatalogRow[];
  eceOnly: CatalogRow[];
  cse: CatalogRow[];
  ece: CatalogRow[];
  codes: Set<string>;
  sharedCodes: Set<string>;
};

/** Physics uses EN201N (CSE) and EN201 (ECE) but is one shared subject in the official grid. */
export const JNU_PHYSICS_CROSS_BRANCH = {
  cseCode: 'EN201N',
  eceCode: 'EN201',
  subject: 'Physics',
} as const;

function semCatalog(
  shared: CatalogRow[],
  cseOnly: CatalogRow[] = [],
  eceOnly: CatalogRow[] = [],
): JnuSemesterCatalog {
  const cse = [...shared, ...cseOnly];
  const ece = [...shared, ...eceOnly];
  const codes = new Set([...cse, ...ece].map((r) => r.code));
  const sharedCodes = new Set(shared.map((r) => r.code));
  return { shared, cseOnly, eceOnly, cse, ece, codes, sharedCodes };
}

/** Official B.Tech course codes per progression semester (1, 3, 5, 7, 9). */
export const JNU_BTECH_SEMESTER_CATALOG: Record<number, JnuSemesterCatalog> = {
  1: semCatalog(
    [
      { code: 'EN104N', subject: 'Engineering Foundation-I (Computer Programming)', faculty: 'Dr. Ankit Kumar Jaiswal' },
      { code: 'EN103', subject: 'Engineering Mathematics-I (Calculus and Transform)', faculty: 'Dr. Shashank Vadlamani' },
      { code: 'EN102', subject: 'Environmental Studies', faculty: 'Dr. K. Kranthi Kumar' },
      { code: 'EN106M', subject: 'Engineering Drawing & Visualization', faculty: 'Dr. B. Sangmesh' },
      { code: 'EN108N', subject: 'English in Practice', faculty: 'Dr. Sandesha Rayapa' },
    ],
    [{ code: 'EN201N', subject: 'Physics', faculty: 'Dr. Arvind Kumar / Dr. Lavish Kumar Singh / SPS Faculty' }],
    [{ code: 'EN201', subject: 'Physics', faculty: 'Dr. Arvind Kumar / Dr. Lavish Kumar Singh / SPS Faculty' }],
  ),
  3: semCatalog(
    [
      { code: 'EN303', subject: 'Digital Logic and Systems Design', faculty: 'Dr. Lakshmi Priya' },
      { code: 'EN308', subject: 'Engineering Foundation-III (Introduction to AI)', faculty: 'Dr. Deepak Sharma' },
      { code: 'EN469', subject: 'Linear Algebra', faculty: 'Dr. Rituraj Singh' },
      { code: 'EN476', subject: 'Object Oriented Programming with JAVA', faculty: 'Dr. Anupama Namburu' },
      { code: 'EN405', subject: 'Data Base Management Systems', faculty: 'Dr. Benay Kumar Ray' },
    ],
    [],
    [{ code: 'EN307', subject: 'Network Analysis and Synthesis', faculty: 'Dr. Pushpendra Singh' }],
  ),
  5: semCatalog(
    [
      { code: 'EN502', subject: 'Machine Learning', faculty: 'Dr. Jyoti Singh Kirar' },
      { code: 'EN478N', subject: 'Professional Ethics and Technical Writing', faculty: 'Dr. Lavish Kumar Singh / New Faculty' },
    ],
    [
      { code: 'EN501', subject: 'Operating Systems', faculty: 'Dr. Anupama Namburu' },
      { code: 'EN451', subject: 'Theory of Computation', faculty: 'Dr. Krishnan Rajkumar' },
      { code: 'EN452', subject: 'Computer Networks', faculty: 'Dr. Mukesh Kumar Giluka' },
      { code: 'EN453', subject: 'Software Engineering', faculty: 'Dr. Ankit Chaudhary' },
    ],
    [
      { code: 'EN510N', subject: 'Electromagnetic Field Theory', faculty: 'Dr. Ashwini Kumar Arya' },
      { code: 'EN511', subject: 'Control Systems', faculty: 'Dr. Renuka Devi' },
      { code: 'EN514M', subject: 'Microprocessors', faculty: 'Dr. Pushpendra Singh' },
      { code: 'EN408', subject: 'Analog Electronics', faculty: 'Dr. Ayushi Barthwal' },
    ],
  ),
  7: semCatalog(
    [
      { code: 'EN740', subject: 'Natural Language Processing', faculty: 'Dr. Krishnan Rajkumar' },
      { code: 'EN361', subject: 'Operational Research', faculty: 'Dr. Mukuloth Srinivasnaik' },
    ],
    [{ code: 'EN715', subject: 'Advanced Operating System', faculty: 'Dr. Mukesh Kumar Giluka' }],
    [{ code: 'EN110', subject: 'Fibre Optic Communication', faculty: 'Dr. Ayushi Barthwal' }],
  ),
  9: semCatalog(
    [],
    [
      { code: 'EN647', subject: 'Parallel & Distributed Systems', faculty: 'Dr. Benay Kumar Ray' },
      { code: 'EN715', subject: 'Advanced Operating System', faculty: 'Dr. Mukesh Kumar Giluka' },
    ],
    [
      { code: 'EN814', subject: 'Analog Integrated Circuits', faculty: 'Dr. Renuka Devi' },
      { code: 'EN815', subject: 'RF and Microwave Components', faculty: 'Dr. Ashwini Kumar Arya' },
    ],
  ),
};

export function allowedCourseCodesForSemester(semesterNumber: number): Set<string> | null {
  const entry = JNU_BTECH_SEMESTER_CATALOG[semesterNumber];
  return entry?.codes ?? null;
}

export function sharedCourseCodesForSemester(semesterNumber: number): string[] {
  const split = sharedSubjectsSummaryForSemester(semesterNumber);
  const codes = split.shared.map((r) => r.code);
  if (split.crossBranchPhysics) {
    codes.push(split.crossBranchPhysics.cseCode, split.crossBranchPhysics.eceCode);
  }
  return [...new Set(codes)];
}

export function isSharedCourseCode(semesterNumber: number, courseCode: string): boolean {
  const entry = JNU_BTECH_SEMESTER_CATALOG[semesterNumber];
  if (!entry) return false;
  const code = courseCode.toUpperCase();
  if (entry.sharedCodes.has(code)) return true;
  return code === JNU_PHYSICS_CROSS_BRANCH.cseCode || code === JNU_PHYSICS_CROSS_BRANCH.eceCode;
}

export function isCrossBranchPhysicsPair(codeA: string, codeB: string): boolean {
  const a = codeA.toUpperCase();
  const b = codeB.toUpperCase();
  return (
    (a === JNU_PHYSICS_CROSS_BRANCH.cseCode && b === JNU_PHYSICS_CROSS_BRANCH.eceCode) ||
    (a === JNU_PHYSICS_CROSS_BRANCH.eceCode && b === JNU_PHYSICS_CROSS_BRANCH.cseCode)
  );
}

export function sharedSubjectsSummaryForSemester(semesterNumber: number): {
  shared: CatalogRow[];
  cseOnly: CatalogRow[];
  eceOnly: CatalogRow[];
  crossBranchPhysics: typeof JNU_PHYSICS_CROSS_BRANCH | null;
} {
  const entry = JNU_BTECH_SEMESTER_CATALOG[semesterNumber];
  if (!entry) {
    return { shared: [], cseOnly: [], eceOnly: [], crossBranchPhysics: null };
  }
  const hasPhysics =
    entry.cseOnly.some((r) => r.code === JNU_PHYSICS_CROSS_BRANCH.cseCode) ||
    entry.eceOnly.some((r) => r.code === JNU_PHYSICS_CROSS_BRANCH.eceCode);
  return {
    shared: entry.shared,
    cseOnly: entry.cseOnly,
    eceOnly: entry.eceOnly,
    crossBranchPhysics: hasPhysics ? JNU_PHYSICS_CROSS_BRANCH : null,
  };
}

export function catalogSummaryForSemester(semesterNumber: number): string {
  const entry = JNU_BTECH_SEMESTER_CATALOG[semesterNumber];
  if (!entry) {
    return `No embedded catalog for semester number ${semesterNumber}; use only B.Tech courses linked to this semester in the LMS.`;
  }
  const split = sharedSubjectsSummaryForSemester(semesterNumber);
  return JSON.stringify(
    {
      semesterNumber,
      sharedCseAndEce: split.shared,
      cseOnly: split.cseOnly,
      eceOnly: split.eceOnly,
      crossBranchPhysics: split.crossBranchPhysics,
      schedulingRule:
        'Shared rows use the same faculty and the same clock time/room for CSE and ECE when the official grid says so; show both section names as a combined class.',
      excludedUnlessVerified: [...JNU_UNVERIFIED_COURSE_CODES],
    },
    null,
    2,
  );
}
