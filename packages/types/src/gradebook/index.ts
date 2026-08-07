import type { AssessmentGradingMethod, AssessmentKind } from '../assessment/index.js';
import type { ID } from '../common/index.js';

export type GradebookEntryStatus = 'pending' | 'final' | 'exported' | 'superseded';

export type CourseGradeStatus =
  | 'draft'
  | 'faculty_review'
  | 'published'
  | 'revision'
  | 'archived'
  | 'finalized';

export type GradeResult = 'pass' | 'fail' | 'incomplete';

export type GradeAppealStatus = 'pending' | 'under_review' | 'accepted' | 'rejected';

export type GradeCommentVisibility = 'internal' | 'faculty' | 'student';

export type GradebookAttemptPolicy = 'best' | 'latest' | 'average';

export type GradebookReportType =
  | 'student'
  | 'course'
  | 'department'
  | 'semester'
  | 'program'
  | 'institution';

/** Consumed assessment item — alias: GradebookItem */
export interface GradebookEntry {
  id: ID;
  institutionId: ID;
  courseId: ID;
  studentId: ID;
  enrollmentId: ID | null;
  activityKind: AssessmentKind;
  activityId: ID;
  activityTitle: string;
  sourceCollection: string;
  sourceRefId: ID;
  gradingMethod: AssessmentGradingMethod;
  marksObtained: number | null;
  totalMarks: number | null;
  percentage: number | null;
  passed: boolean | null;
  weightage: number;
  status: GradebookEntryStatus;
  consumedAt: string;
  gradedAt: string | null;
  gradedBy: ID | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** @alias GradebookItem */
export type GradebookItem = GradebookEntry;

/** Course-level grade record — alias: Gradebook, CourseGrade */
export interface CourseGradeSummary {
  id: ID;
  institutionId: ID;
  courseId: ID;
  studentId: ID;
  enrollmentId: ID | null;
  semesterId: ID | null;
  facultyId: ID | null;
  weightedPercentage: number | null;
  finalMarks: number | null;
  percentage: number | null;
  letterGrade: string | null;
  gradePoints: number | null;
  result: GradeResult | null;
  totalMarksEarned: number;
  totalMarksPossible: number;
  entryCount: number;
  status: CourseGradeStatus;
  locked: boolean;
  published: boolean;
  publishedAt: string | null;
  finalizedAt: string | null;
  finalizedBy: ID | null;
  lockedAt: string | null;
  lockedBy: ID | null;
  createdAt: string;
  updatedAt: string;
}

/** @alias Gradebook */
export type Gradebook = CourseGradeSummary;

/** @alias CourseGrade */
export type CourseGrade = CourseGradeSummary;

/** @alias AssessmentWeight */
export interface GradebookWeightScheme {
  id: ID;
  institutionId: ID;
  courseId: ID;
  assignmentWeight: number;
  labWeight: number;
  quizWeight: number;
  examWeight: number;
  midtermWeight: number;
  finalExamWeight: number;
  projectWeight: number;
  attendanceWeight: number;
  extraCreditWeight: number;
  attemptPolicy: GradebookAttemptPolicy;
  scaleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AssessmentWeight = GradebookWeightScheme;

export interface SemesterGrade {
  id: ID;
  institutionId: ID;
  studentId: ID;
  semesterId: ID;
  programId: ID | null;
  semesterGpa: number | null;
  totalCredits: number;
  earnedCredits: number;
  courseCount: number;
  status: CourseGradeStatus;
  locked: boolean;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CGPARecord {
  id: ID;
  institutionId: ID;
  studentId: ID;
  programId: ID | null;
  cgpa: number | null;
  totalCredits: number;
  completedCredits: number;
  updatedAt: string;
  createdAt: string;
}

export interface GradeHistory {
  id: ID;
  institutionId: ID;
  courseGradeId: ID;
  courseId: ID;
  studentId: ID;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string | null;
  changedBy: ID | null;
  createdAt: string;
}

export interface GradeAppeal {
  id: ID;
  institutionId: ID;
  courseGradeId: ID;
  courseId: ID;
  studentId: ID;
  reason: string;
  status: GradeAppealStatus;
  submittedAt: string;
  reviewedBy: ID | null;
  reviewedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GradeComment {
  id: ID;
  institutionId: ID;
  courseGradeId: ID | null;
  gradebookEntryId: ID | null;
  courseId: ID;
  studentId: ID;
  authorId: ID;
  visibility: GradeCommentVisibility;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradebookCourseDashboard {
  courseId: ID;
  enrollmentCount: number;
  entryCount: number;
  finalizedSummaries: number;
  publishedSummaries: number;
  lockedSummaries: number;
  pendingProjectGrades: number;
  pendingAppeals: number;
  averageWeightedPercentage: number;
}

export interface GradebookStudentDashboard {
  courseCount: number;
  finalizedCourses: number;
  publishedCourses: number;
  averagePercentage: number;
  semesterGpa: number | null;
  cgpa: number | null;
  pendingAppeals: number;
  recentEntries: GradebookEntry[];
}

export interface GradebookInstitutionDashboard {
  courseCount: number;
  entryCount: number;
  finalizedSummaries: number;
  publishedSummaries: number;
  pendingAppeals: number;
  averageWeightedPercentage: number;
  passRate: number;
  gradeDistribution: Record<string, number>;
}

export interface CourseGradebookMatrix {
  courseId: ID;
  students: Array<{
    studentId: ID;
    summary: CourseGradeSummary | null;
    entries: GradebookEntry[];
  }>;
  activityColumns: Array<{ activityKind: AssessmentKind; activityId: ID; title: string }>;
}

export interface GradeReport {
  type: GradebookReportType;
  generatedAt: string;
  filters: Record<string, unknown>;
  rows: Array<Record<string, unknown>>;
  summary: Record<string, unknown>;
}
