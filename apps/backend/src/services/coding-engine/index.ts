/**
 * Coding Assessment Engine
 *
 * Independent execution infrastructure for Practice Labs and Coding Exams.
 * Do not reimplement Judge0 / scoring / language catalog in the exam module.
 */

export {
  CodingEngine,
  createCodingEngine,
} from './coding-engine.js';
export {
  codingLanguageService,
  CodingLanguageService,
} from './language.service.js';
export {
  judge0Client,
  judge0IdForLanguage,
  mapJudge0StatusToExecutionStatus,
  type Judge0Result,
  type CreateSubmissionInput,
} from './judge0.client.js';
export {
  createPracticeLabCodingStorage,
  labActivityRef,
} from './practice-lab.storage.js';
export type {
  CodingActivityKind,
  CodingActivityRef,
  CodingCaseResult,
  CodingEngineStorage,
  CodingEngineTestCase,
  CodingEvaluateInput,
  CodingEvaluateResult,
  CodingRunInput,
  CodingRunResult,
  CodingStatusEmitter,
  CodingSubmissionCreateInput,
  CodingSubmissionRecord,
} from './types.js';
