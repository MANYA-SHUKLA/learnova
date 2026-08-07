import type { ID } from '../common/index.js';

export type ExamType =
  | 'midterm'
  | 'final'
  | 'internal'
  | 'external'
  | 'practical'
  | 'viva';

export type ExamStatus = 'draft' | 'scheduled' | 'published' | 'in_progress' | 'completed' | 'archived' | 'cancelled';

export type ExamVisibility = 'institution' | 'enrolled' | 'faculty';

export type ProctoringMode = 'none' | 'live' | 'record_review' | 'ai_assisted';

export type SecureBrowserPolicy = 'off' | 'recommended' | 'required';

export type ExamAttemptStatus =
  | 'scheduled'
  | 'checked_in'
  | 'started'
  | 'submitted'
  | 'completed'
  | 'expired'
  | 'terminated'
  | 'absent';

export type ProctorEventType =
  | 'session_started'
  | 'session_ended'
  | 'tab_switch'
  | 'fullscreen_exit'
  | 'camera_off'
  | 'microphone_off'
  | 'suspicious_activity'
  | 'manual_flag'
  | 'manual_clear'
  | 'attempt_terminated';

export interface ExamSchedule {
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  checkInOpensAt: string | null;
  startsAt: string;
  endsAt: string;
  lateEntryMinutes: number;
  gracePeriodMinutes: number;
}

export interface ExamProctoringPolicy {
  mode: ProctoringMode;
  secureBrowser: SecureBrowserPolicy;
  requireWebcam: boolean;
  requireMicrophone: boolean;
  blockCopyPaste: boolean;
  blockRightClick: boolean;
  blockNewTabs: boolean;
  requireFullscreen: boolean;
  maxTabSwitches: number;
  autoTerminateOnViolation: boolean;
  invigilatorIds: ID[];
}

export interface ExamRules {
  passingMarks: number;
  totalMarks: number;
  durationMinutes: number;
  attemptLimit: number;
  negativeMarking: boolean;
  negativeMarkValue: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultsAfter: 'immediate' | 'schedule_end' | 'manual_release';
  allowReview: boolean;
  showCorrectAnswers: boolean;
}

export interface Exam {
  id: ID;
  institutionId: ID;
  courseId: ID;
  moduleId: ID | null;
  lessonId: ID | null;
  title: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  examType: ExamType;
  visibility: ExamVisibility;
  status: ExamStatus;
  schedule: ExamSchedule;
  proctoring: ExamProctoringPolicy;
  rules: ExamRules;
  sectionIds: ID[];
  questionIds: ID[];
  seatingEnabled: boolean;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ExamSection {
  id: ID;
  institutionId: ID;
  examId: ID;
  title: string;
  description: string | null;
  marks: number;
  questionCount: number;
  randomizeQuestions: boolean;
  randomQuestionCount: number | null;
  displayOrder: number;
  questionIds: ID[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ExamSeating {
  id: ID;
  institutionId: ID;
  examId: ID;
  studentId: ID;
  seatNumber: string;
  room: string | null;
  row: string | null;
  column: string | null;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamAttempt {
  id: ID;
  institutionId: ID;
  examId: ID;
  studentId: ID;
  courseId: ID;
  attemptNumber: number;
  scheduledAt: string | null;
  checkedInAt: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  status: ExamAttemptStatus;
  score: number;
  percentage: number;
  timeTakenSeconds: number;
  autoSubmitted: boolean;
  proctorSessionId: ID | null;
  violationCount: number;
  terminatedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamAnswer {
  id: ID;
  institutionId: ID;
  attemptId: ID;
  questionId: ID;
  selectedOptionIds: ID[];
  textAnswer: string | null;
  matchAnswers: Record<string, string>;
  isCorrect: boolean | null;
  marksAwarded: number;
  timeSpentSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamResult {
  id: ID;
  institutionId: ID;
  attemptId: ID;
  examId: ID;
  studentId: ID;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  percentage: number;
  passed: boolean;
  rank: number | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamProctorSession {
  id: ID;
  institutionId: ID;
  examId: ID;
  attemptId: ID;
  proctorId: ID;
  startedAt: string;
  endedAt: string | null;
  status: 'active' | 'closed';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamProctorEvent {
  id: ID;
  institutionId: ID;
  examId: ID;
  attemptId: ID;
  proctorSessionId: ID | null;
  eventType: ProctorEventType;
  severity: 'info' | 'warning' | 'critical';
  message: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ExamFacultyDashboard {
  examsScheduled: number;
  examsInProgress: number;
  totalAttempts: number;
  averageScore: number;
  violationRate: number;
}

export interface ExamStudentDashboard {
  upcomingExams: number;
  checkedInExams: number;
  completedExams: number;
  averageScore: number;
  recentAttempts: ExamAttempt[];
}

export interface ExamInstitutionDashboard {
  totalExams: number;
  scheduledExams: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  proctoredSessions: number;
}

export interface ExamAnalytics {
  examId: ID;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  averageTimeSeconds: number;
  violationCount: number;
  questionStats: Array<{
    questionId: ID;
    title: string;
    accuracy: number;
    incorrectRate: number;
  }>;
}

export type InvigilatorRole = 'view_only' | 'monitor' | 'intervene';

export interface ExamBlueprintSlot {
  difficulty?: string | null;
  category?: string | null;
  marks?: number | null;
  count: number;
}

export interface ExamBlueprint {
  id: ID;
  institutionId: ID;
  courseId: ID | null;
  name: string;
  description: string | null;
  totalMarks: number;
  slots: ExamBlueprintSlot[];
  questionPoolIds: ID[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamTemplate {
  id: ID;
  institutionId: ID;
  name: string;
  description: string | null;
  examType: ExamType;
  visibility: ExamVisibility;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  attemptLimit: number;
  reconnectionGraceMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamIncident {
  id: ID;
  examId: ID;
  attemptId: ID | null;
  incidentType: string;
  severity: 'info' | 'warning' | 'critical';
  message: string | null;
  createdAt: string;
}

export interface ExamAccessibilityAccommodation {
  id: ID;
  examId: ID;
  studentId: ID;
  extendedTimePercent: number;
  extraMinutes: number;
  fontSize: 'default' | 'large' | 'xlarge';
  screenReaderAllowed: boolean;
}

export interface ExamVersion {
  id: ID;
  examId: ID;
  versionNumber: number;
  publishedAt: string;
  immutable: boolean;
}
