/**
 * Central seed volume profiles.
 *
 * Set SEED_PROFILE=minimal for 2-of-everything demo data (no practice labs).
 * Default SEED_PROFILE=complete keeps existing full-scale targets.
 */

export type SeedProfileName = 'complete' | 'minimal';

export interface SeedCounts {
  departments: number;
  programs: number;
  semesters: number;
  sections: number;
  batches: number;
  faculty: number;
  students: number;
  courses: number;
  enrollments: number;
  waitlist: number;
  courseBuilderCourses: number;
  modulesPerCourse: number;
  lessonsPerModule: number;
  progressLimit: number;
  assignments: number;
  submissions: number;
  rubrics: number;
  quizzes: number;
  questions: number;
  quizAttempts: number;
  questionBanks: number;
  projects: number;
  exams: number;
  examAttempts: number;
  examAnnouncements: number;
  gradeSummaries: number;
  gradeItems: number;
  certificates: number;
  transcripts: number;
  demoCourseCount: number;
  demoUsers: number;
}

const COMPLETE_COUNTS: SeedCounts = {
  departments: 5,
  programs: 4,
  semesters: 6,
  sections: 4,
  batches: 4,
  faculty: 100,
  students: 1000,
  courses: 100,
  enrollments: 1200,
  waitlist: 50,
  courseBuilderCourses: 30,
  modulesPerCourse: 3,
  lessonsPerModule: 6,
  progressLimit: 500,
  assignments: 100,
  submissions: 1000,
  rubrics: 12,
  quizzes: 100,
  questions: 5000,
  quizAttempts: 10000,
  questionBanks: 10,
  projects: 50,
  exams: 50,
  examAttempts: 1000,
  examAnnouncements: 30,
  gradeSummaries: 5000,
  gradeItems: 10000,
  certificates: 1000,
  transcripts: 500,
  demoCourseCount: 3,
  demoUsers: 1,
};

const MINIMAL_COUNTS: SeedCounts = {
  departments: 2,
  programs: 2,
  semesters: 2,
  sections: 2,
  batches: 2,
  faculty: 2,
  students: 2,
  courses: 2,
  enrollments: 4,
  waitlist: 2,
  courseBuilderCourses: 2,
  modulesPerCourse: 2,
  lessonsPerModule: 2,
  progressLimit: 4,
  assignments: 2,
  submissions: 4,
  rubrics: 2,
  quizzes: 2,
  questions: 4,
  quizAttempts: 4,
  questionBanks: 2,
  projects: 2,
  exams: 2,
  examAttempts: 4,
  examAnnouncements: 2,
  gradeSummaries: 4,
  gradeItems: 8,
  certificates: 2,
  transcripts: 2,
  demoCourseCount: 2,
  demoUsers: 2,
};

export function resolveSeedProfile(): SeedProfileName {
  const raw = process.env.SEED_PROFILE?.trim().toLowerCase();
  if (raw === 'minimal') return 'minimal';
  return 'complete';
}

export function getSeedCounts(profile: SeedProfileName = resolveSeedProfile()): SeedCounts {
  return profile === 'minimal' ? MINIMAL_COUNTS : COMPLETE_COUNTS;
}
