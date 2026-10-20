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
`.trim();

type CatalogRow = { code: string; subject: string; faculty: string };

function semCatalog(
  shared: CatalogRow[],
  cseOnly: CatalogRow[] = [],
  eceOnly: CatalogRow[] = [],
): { cse: CatalogRow[]; ece: CatalogRow[]; codes: Set<string> } {
  const cse = [...shared, ...cseOnly];
  const ece = [...shared, ...eceOnly];
  const codes = new Set([...cse, ...ece].map((r) => r.code));
  return { cse, ece, codes };
}

/** Official B.Tech course codes per progression semester (1, 3, 5, 7, 9). */
export const JNU_BTECH_SEMESTER_CATALOG: Record<
  number,
  { cse: CatalogRow[]; ece: CatalogRow[]; codes: Set<string> }
> = {
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

export function catalogSummaryForSemester(semesterNumber: number): string {
  const entry = JNU_BTECH_SEMESTER_CATALOG[semesterNumber];
  if (!entry) {
    return `No embedded catalog for semester number ${semesterNumber}; use only B.Tech courses linked to this semester in the LMS.`;
  }
  return JSON.stringify(
    {
      semesterNumber,
      bTechCse: entry.cse,
      bTechEce: entry.ece,
      excludedUnlessVerified: [...JNU_UNVERIFIED_COURSE_CODES],
    },
    null,
    2,
  );
}
