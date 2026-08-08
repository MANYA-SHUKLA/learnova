/**
 * Backend adapter — re-exports Examination policy layer from @learnova/shared.
 * Exam Management must import from here or @learnova/shared.
 * Do not duplicate evaluation, scoring, or proctoring logic in this folder.
 */

export type {
  EvaluableQuestion,
  QuestionAnswerInput as AnswerInput,
  EvaluatedQuestionAnswer as EvaluatedAnswer,
  QuestionAttemptScore,
  QuestionAttemptSettings,
  TimedAttemptContext as AttemptContext,
  RenderedAssessmentQuestion as RenderedQuestion,
  ExamSchedule,
  ExamProctoringPolicy,
  SecureBrowserPolicy,
} from '@learnova/types';

export {
  examinationEngine,
  evaluateQuestionAnswer,
  scoreQuestionAttempt,
  renderQuestionForAttempt,
  renderQuestionForReview,
  selectQuestionsForActivity,
  isTimedAttemptExpired,
  remainingAttemptSeconds,
  computeAttemptDurationSeconds,
  resolveTimedAttemptStatus,
  canStartQuestionAttempt,
  nextQuestionAttemptNumber,
  evaluateExamWindow,
  canCheckIn,
  canStartExamAttempt,
  validateSecureBrowser,
  evaluateProctorViolation,
  computePassRate,
  rankMostIncorrectQuestions,
} from '@learnova/shared';
