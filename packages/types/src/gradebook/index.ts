import type { AssessmentGradingMethod, AssessmentKind } from '../assessment/index.js';
import type { ID } from '../common/index.js';

export type GradebookEntryStatus = 'pending' | 'final' | 'exported' | 'superseded';

export type CourseGradeStatus = 'draft' | 'finalized';

export type GradebookAttemptPolicy = 'best' | 'latest' | 'average';

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

export interface CourseGradeSummary {
  id: ID;
  institutionId: ID;
  courseId: ID;
  studentId: ID;
  enrollmentId: ID | null;
  weightedPercentage: number | null;
  letterGrade: string | null;
  totalMarksEarned: number;
  totalMarksPossible: number;
  entryCount: number;
  status: CourseGradeStatus;
  finalizedAt: string | null;
  finalizedBy: ID | null;
  createdAt: string;
  updatedAt: string;
}

export interface GradebookWeightScheme {
  id: ID;
  institutionId: ID;
  courseId: ID;
  assignmentWeight: number;
  labWeight: number;
  quizWeight: number;
  examWeight: number;
  projectWeight: number;
  attemptPolicy: GradebookAttemptPolicy;
  createdAt: string;
  updatedAt: string;
}

export interface GradebookCourseDashboard {
  courseId: ID;
  enrollmentCount: number;
  entryCount: number;
  finalizedSummaries: number;
  pendingProjectGrades: number;
  averageWeightedPercentage: number;
}

export interface GradebookStudentDashboard {
  courseCount: number;
  finalizedCourses: number;
  averagePercentage: number;
  recentEntries: GradebookEntry[];
}
