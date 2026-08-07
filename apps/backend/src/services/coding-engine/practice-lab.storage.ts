import type { PracticeLanguage } from '@learnova/types';
import { practiceLabRepository } from '../../repositories/practice-lab/index.js';
import type {
  CodingActivityRef,
  CodingCaseResult,
  CodingEngineStorage,
  CodingSubmissionCreateInput,
  CodingSubmissionRecord,
} from './types.js';

/**
 * Practice Lab storage adapter for the coding engine.
 * Coding Exams will ship a parallel adapter — do not fork Judge0/scoring here.
 */
export function createPracticeLabCodingStorage(): CodingEngineStorage {
  return {
    async createExecution(data) {
      const activity = data.activity;
      const doc = await practiceLabRepository.createExecution({
        institutionId: data.institutionId,
        practiceLabId: activity.kind === 'lab' ? activity.activityId : null,
        problemId: activity.problemId,
        studentId: data.studentId,
        language: data.language,
        sourceCode: data.sourceCode,
        stdin: data.stdin ?? null,
        stdout: data.stdout ?? null,
        stderr: data.stderr ?? null,
        compileOutput: data.compileOutput ?? null,
        status: data.status,
        exitCode: data.exitCode ?? null,
        executionTimeMS: data.executionTimeMS ?? null,
        memoryKB: data.memoryKB ?? null,
        submissionId: data.submissionId ?? null,
        isSubmission: data.isSubmission,
        judge0Token: data.judge0Token ?? null,
      });
      return { id: String(doc._id) };
    },

    async updateExecution(id, data) {
      await practiceLabRepository.updateExecution(id, data);
    },

    async createSubmission(data: CodingSubmissionCreateInput) {
      if (data.activity.kind !== 'lab' || !data.activity.activityId || !data.activity.problemId) {
        throw new Error('Practice lab submission requires lab activityId and problemId');
      }
      const doc = await practiceLabRepository.createSubmission({
        institutionId: data.institutionId,
        practiceLabId: data.activity.activityId,
        problemId: data.activity.problemId,
        studentId: data.studentId,
        language: data.language,
        sourceCode: data.sourceCode,
        verdict: 'pending',
        score: 0,
        maxScore: data.maxScore,
        passedCount: 0,
        totalCount: data.totalCount,
        attemptNumber: data.attemptNumber,
        results: [],
      });
      return { id: String(doc._id) };
    },

    async updateSubmission(id, data) {
      const updated = await practiceLabRepository.updateSubmission(id, {
        verdict: data.verdict,
        score: data.score,
        maxScore: data.maxScore,
        passedCount: data.passedCount,
        totalCount: data.totalCount,
        executionTimeMS: data.executionTimeMS,
        memoryKB: data.memoryKB,
        compileOutput: data.compileOutput,
        results: data.results,
      });
      if (!updated) return null;
      return toSubmissionRecord(updated);
    },
  };
}

function toSubmissionRecord(doc: {
  _id: { toString(): string };
  institutionId: { toString(): string };
  practiceLabId: { toString(): string };
  problemId: { toString(): string };
  studentId: { toString(): string };
  language: PracticeLanguage;
  sourceCode: string;
  verdict: CodingSubmissionRecord['verdict'];
  score: number;
  maxScore: number;
  passedCount: number;
  totalCount: number;
  attemptNumber: number;
  executionTimeMS?: number | null;
  memoryKB?: number | null;
  compileOutput?: string | null;
  results?: CodingCaseResult[];
  createdAt?: Date;
  updatedAt?: Date;
}): CodingSubmissionRecord {
  return {
    id: String(doc._id),
    institutionId: String(doc.institutionId),
    studentId: String(doc.studentId),
    language: doc.language,
    sourceCode: doc.sourceCode,
    verdict: doc.verdict,
    score: doc.score,
    maxScore: doc.maxScore,
    passedCount: doc.passedCount,
    totalCount: doc.totalCount,
    attemptNumber: doc.attemptNumber,
    executionTimeMS: doc.executionTimeMS ?? null,
    memoryKB: doc.memoryKB ?? null,
    compileOutput: doc.compileOutput ?? null,
    results: (doc.results ?? []) as CodingCaseResult[],
    practiceLabId: String(doc.practiceLabId),
    problemId: String(doc.problemId),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function labActivityRef(
  practiceLabId: string | null,
  problemId: string | null,
): CodingActivityRef {
  return {
    kind: 'lab',
    activityId: practiceLabId,
    problemId,
  };
}
