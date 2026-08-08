/**
 * Backend adapter — re-exports Assessment Core question engine.
 * Quiz Management and Exam Management (Step 13) must import from here or @learnova/shared.
 * Do not duplicate evaluation or attempt logic in this folder.
 */

export type {
  EvaluableQuestion,
  QuestionAnswerInput as AnswerInput,
  EvaluatedQuestionAnswer as EvaluatedAnswer,
  QuestionAttemptScore,
  QuestionAttemptSettings,
  TimedAttemptContext as AttemptContext,
  RenderedAssessmentQuestion as RenderedQuestion,
} from '@learnova/types';

export {
  assessmentQuestionEngine,
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
  computeQuestionAccuracy,
  computePassRate,
  rankMostIncorrectQuestions,
} from '@learnova/shared';

import {
  assessmentQuestionEngine,
  evaluateQuestionAnswer,
  scoreQuestionAttempt,
  canStartQuestionAttempt,
  nextQuestionAttemptNumber,
  isTimedAttemptExpired,
  remainingAttemptSeconds,
  computeAttemptDurationSeconds,
  resolveTimedAttemptStatus,
} from '@learnova/shared';

/** @deprecated Use assessmentQuestionEngine from @learnova/shared */
export const evaluateAnswer = evaluateQuestionAnswer;

/** @deprecated Use scoreQuestionAttempt from @learnova/shared */
export const evaluateAttempt = scoreQuestionAttempt;

/** @deprecated Use selectQuestionsForActivity from @learnova/shared */
export const selectQuestionsForQuiz = assessmentQuestionEngine.selectQuestionsForActivity;

/** @deprecated Use canStartQuestionAttempt from @learnova/shared */
export const canStartAttempt = canStartQuestionAttempt;

/** @deprecated Use nextQuestionAttemptNumber from @learnova/shared */
export const nextAttemptNumber = nextQuestionAttemptNumber;

/** @deprecated Use isTimedAttemptExpired from @learnova/shared */
export const isAttemptExpired = isTimedAttemptExpired;

/** @deprecated Use remainingAttemptSeconds from @learnova/shared */
export const remainingSeconds = remainingAttemptSeconds;

/** @deprecated Use computeAttemptDurationSeconds from @learnova/shared */
export const computeTimeTakenSeconds = computeAttemptDurationSeconds;

/** @deprecated Use resolveTimedAttemptStatus from @learnova/shared */
export const resolveAttemptStatus = resolveTimedAttemptStatus;

/**
 * @deprecated Prefer assessmentQuestionEngine from @learnova/shared.
 * Kept for backward-compatible imports within the backend.
 */
export const quizEngine = {
  evaluateAnswer: evaluateQuestionAnswer,
  evaluateAttempt: scoreQuestionAttempt,
  renderQuestionForAttempt: assessmentQuestionEngine.renderQuestionForAttempt,
  renderQuestionForReview: assessmentQuestionEngine.renderQuestionForReview,
  selectQuestionsForQuiz: assessmentQuestionEngine.selectQuestionsForActivity,
  isAttemptExpired: isTimedAttemptExpired,
  remainingSeconds: remainingAttemptSeconds,
  computeTimeTakenSeconds: computeAttemptDurationSeconds,
  resolveAttemptStatus: resolveTimedAttemptStatus,
  canStartAttempt: canStartQuestionAttempt,
  nextAttemptNumber: nextQuestionAttemptNumber,
};
