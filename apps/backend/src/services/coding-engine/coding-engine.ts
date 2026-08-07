import {
  computeSubmissionScore,
  mapJudge0StatusToExecutionStatus,
  outputsMatch,
  verdictToExecutionStatus,
} from '@learnova/shared';
import type { ExecutionStatus } from '@learnova/types';
import { judge0Client, judge0IdForLanguage } from './judge0.client.js';
import type {
  CodingCaseResult,
  CodingEngineStorage,
  CodingEvaluateInput,
  CodingEvaluateResult,
  CodingRunInput,
  CodingRunResult,
  CodingStatusEmitter,
} from './types.js';

const DEFAULT_TIME_MS = 2000;
const DEFAULT_MEMORY_MB = 256;

/**
 * Core coding assessment engine — execution, evaluation, history, scoring.
 * Practice Labs and Coding Exams must call this instead of talking to Judge0 directly.
 */
export class CodingEngine {
  constructor(
    private readonly storage: CodingEngineStorage,
    private readonly emitStatus?: CodingStatusEmitter,
  ) {}

  /**
   * Single interactive run (no expected-output comparison).
   * Persists execution history via the injected storage adapter.
   */
  async run(
    input: CodingRunInput,
    opts?: { notifyRoom?: string },
  ): Promise<CodingRunResult> {
    const timeLimitMS = input.timeLimitMS ?? DEFAULT_TIME_MS;
    const memoryLimitMB = input.memoryLimitMB ?? DEFAULT_MEMORY_MB;
    const stdin = input.stdin ?? '';

    const execution = await this.storage.createExecution({
      institutionId: input.institutionId,
      studentId: input.studentId,
      language: input.language,
      sourceCode: input.sourceCode,
      stdin,
      status: 'queued',
      isSubmission: false,
      activity: input.activity,
    });

    this.notify(opts?.notifyRoom, {
      executionId: execution.id,
      status: 'queued',
      queuePosition: 1,
    });

    this.notify(opts?.notifyRoom, {
      executionId: execution.id,
      status: 'running',
    });

    const result = await judge0Client.createSubmissionAndWait({
      sourceCode: input.sourceCode,
      languageId: judge0IdForLanguage(input.language),
      stdin,
      cpuTimeLimit: timeLimitMS,
      wallTimeLimit: timeLimitMS + 1000,
      memoryLimit: memoryLimitMB,
    });

    let status = mapJudge0StatusToExecutionStatus(result.status.id);
    // Interactive run: Judge0 "Accepted" means process exited 0 — WA only applies during evaluate()
    if (status === 'wrong_answer') status = 'accepted';

    const executionTimeMS = result.time ? Math.round(parseFloat(result.time) * 1000) : null;

    await this.storage.updateExecution(execution.id, {
      status,
      stdout: result.stdout,
      stderr: result.stderr,
      compileOutput: result.compile_output,
      exitCode: result.exit_code,
      executionTimeMS,
      memoryKB: result.memory,
      judge0Token: result.token,
    });

    this.notify(opts?.notifyRoom, {
      executionId: execution.id,
      status,
    });

    return {
      executionId: execution.id,
      status,
      stdout: result.stdout,
      stderr: result.stderr,
      compileOutput: result.compile_output,
      executionTimeMS,
      memoryKB: result.memory,
      exitCode: result.exit_code,
      judge0Token: result.token,
    };
  }

  /**
   * Run code against a set of test cases and compute a weighted score/verdict.
   * Used by Practice Lab submit and (later) Coding Exam auto-grade.
   */
  async evaluate(
    input: CodingEvaluateInput,
    opts?: { notifyRoom?: string },
  ): Promise<CodingEvaluateResult> {
    const stopOnCompile = input.stopOnCompileError !== false;
    const results: CodingCaseResult[] = [];
    let compileOutput: string | null = null;
    let maxTime: number | null = null;
    let maxMem: number | null = null;

    if (input.submissionId) {
      this.notify(opts?.notifyRoom, {
        executionId: input.submissionId,
        submissionId: input.submissionId,
        status: 'running',
      });
    }

    for (const tc of input.testCases) {
      const judge = await judge0Client.createSubmissionAndWait({
        sourceCode: input.sourceCode,
        languageId: judge0IdForLanguage(input.language),
        stdin: tc.input,
        cpuTimeLimit: tc.timeoutMS ?? input.timeLimitMS,
        wallTimeLimit: (tc.timeoutMS ?? input.timeLimitMS) + 1000,
        memoryLimit: tc.memoryLimitMB ?? input.memoryLimitMB,
      });

      let status = mapJudge0StatusToExecutionStatus(judge.status.id);
      if (judge.compile_output) compileOutput = judge.compile_output;

      const timeMs = judge.time ? Math.round(parseFloat(judge.time) * 1000) : null;
      if (timeMs != null) maxTime = Math.max(maxTime ?? 0, timeMs);
      if (judge.memory != null) maxMem = Math.max(maxMem ?? 0, judge.memory);

      let passed = false;
      if (status === 'compilation_error') {
        passed = false;
      } else if (status === 'accepted' || status === 'wrong_answer') {
        passed = outputsMatch(judge.stdout, tc.expectedOutput);
        status = passed ? 'accepted' : 'wrong_answer';
      }

      results.push({
        testCaseId: tc.id,
        visibility: tc.visibility,
        status,
        stdout: judge.stdout,
        stderr: judge.stderr,
        expectedOutput: tc.expectedOutput,
        executionTimeMS: timeMs,
        memoryKB: judge.memory,
        weight: tc.weight,
        passed,
      });

      if (stopOnCompile && status === 'compilation_error') break;
    }

    const scored = computeSubmissionScore(results);

    if (input.submissionId && this.storage.updateSubmission) {
      await this.storage.updateSubmission(input.submissionId, {
        verdict: scored.verdict,
        score: scored.score,
        maxScore: scored.maxScore,
        passedCount: scored.passedCount,
        totalCount: scored.totalCount,
        executionTimeMS: maxTime,
        memoryKB: maxMem,
        compileOutput,
        results,
      });
    }

    const execStatus: ExecutionStatus = verdictToExecutionStatus(scored.verdict);
    const execution = await this.storage.createExecution({
      institutionId: input.institutionId,
      studentId: input.studentId,
      language: input.language,
      sourceCode: input.sourceCode,
      stdin: null,
      status: execStatus,
      isSubmission: true,
      activity: input.activity,
      submissionId: input.submissionId ?? null,
      compileOutput,
      executionTimeMS: maxTime,
      memoryKB: maxMem,
    });

    if (input.submissionId) {
      this.notify(opts?.notifyRoom, {
        executionId: input.submissionId,
        submissionId: input.submissionId,
        status: scored.verdict,
      });
    }

    return {
      ...scored,
      compileOutput,
      executionTimeMS: maxTime,
      memoryKB: maxMem,
      results,
      executionId: execution.id,
    };
  }

  private notify(
    room: string | undefined,
    payload: {
      executionId: string;
      submissionId?: string | null;
      status: string;
      queuePosition?: number | null;
    },
  ) {
    if (!room || !this.emitStatus) return;
    this.emitStatus({ room, ...payload });
  }
}

export function createCodingEngine(
  storage: CodingEngineStorage,
  emitStatus?: CodingStatusEmitter,
): CodingEngine {
  return new CodingEngine(storage, emitStatus);
}
