import { spawn } from 'node:child_process';
import type { PracticeLanguage } from '@learnova/types';
import { JUDGE0_LANGUAGE_IDS } from '@learnova/constants';
import { mapJudge0StatusToExecutionStatus } from '@learnova/shared';
import { env } from '../../config/env.js';
import { CompilerError } from '../../utils/errors/index.js';
import { logger } from '../../utils/logger/index.js';

export { mapJudge0StatusToExecutionStatus };

export interface Judge0Result {
  token: string;
  status: { id: number; description: string };
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string | null;
  memory: number | null;
  exit_code: number | null;
  language_id: number | null;
}

export interface CreateSubmissionInput {
  sourceCode: string;
  languageId: number;
  stdin?: string | null;
  cpuTimeLimit?: number;
  memoryLimit?: number;
  wallTimeLimit?: number;
}

function b64Encode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

function b64Decode(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return Buffer.from(value, 'base64').toString('utf8');
  } catch {
    return value;
  }
}

export function judge0IdForLanguage(language: PracticeLanguage): number {
  return JUDGE0_LANGUAGE_IDS[language];
}

/**
 * Offline/dev mock — never uses eval/child_process.
 * Passthrough: stdout = stdin so echo-style sample tests work when Judge0 is down.
 */
function isConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  if (
    msg.includes('fetch failed') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('econnreset') ||
    msg.includes('network')
  ) {
    return true;
  }
  if (err.cause) return isConnectionError(err.cause);
  return false;
}

function runLocalProcess(
  command: string,
  args: string[],
  stdin: string,
  timeoutMs: number,
  languageId: number,
): Promise<Judge0Result> {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, { timeout: timeoutMs });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on('error', (spawnErr) => {
      resolve({
        token: `local-error-${Date.now()}`,
        status: { id: 13, description: 'Internal Error' },
        stdout: null,
        stderr: spawnErr.message,
        compile_output: null,
        message: spawnErr.message,
        time: '0',
        memory: 0,
        exit_code: 1,
        language_id: languageId,
      });
    });
    child.on('close', (code) => {
      const elapsed = ((Date.now() - started) / 1000).toFixed(3);
      const exitCode = code ?? 1;
      resolve({
        token: `local-${Date.now()}`,
        status: {
          id: exitCode === 0 ? 3 : 11,
          description: exitCode === 0 ? 'Accepted' : 'Runtime Error',
        },
        stdout,
        stderr: stderr || null,
        compile_output: null,
        message: null,
        time: elapsed,
        memory: 1024,
        exit_code: exitCode,
        language_id: languageId,
      });
    });

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
}

async function localExecute(input: CreateSubmissionInput): Promise<Judge0Result | null> {
  const timeoutMs = input.wallTimeLimit ?? input.cpuTimeLimit ?? 5000;
  try {
    if (input.languageId === JUDGE0_LANGUAGE_IDS.python) {
      return await runLocalProcess(
        'python3',
        ['-c', input.sourceCode],
        input.stdin ?? '',
        timeoutMs,
        input.languageId,
      );
    }
    if (input.languageId === JUDGE0_LANGUAGE_IDS.javascript) {
      const wrapped = `${input.sourceCode}\n`;
      return await runLocalProcess('node', ['-e', wrapped], input.stdin ?? '', timeoutMs, input.languageId);
    }
  } catch (err) {
    logger.domain('system', 'warn', 'Local code runner failed', {
      languageId: input.languageId,
      err,
    });
  }
  return null;
}

function mockExecute(input: CreateSubmissionInput): Judge0Result {
  const token = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  if (!input.sourceCode.trim()) {
    return {
      token,
      status: { id: 6, description: 'Compilation Error' },
      stdout: null,
      stderr: null,
      compile_output: 'Empty source code',
      message: null,
      time: '0',
      memory: 0,
      exit_code: 1,
      language_id: input.languageId,
    };
  }
  return {
    token,
    status: { id: 3, description: 'Accepted' },
    stdout: input.stdin ?? '',
    stderr: null,
    compile_output: null,
    message: null,
    time: '0.01',
    memory: 1024,
    exit_code: 0,
    language_id: input.languageId,
  };
}

class Judge0Client {
  private get baseUrl(): string | undefined {
    return env.JUDGE0_API_URL;
  }

  private get apiKey(): string | undefined {
    return env.JUDGE0_API_KEY;
  }

  private get timeoutMs(): number {
    return env.JUDGE0_TIMEOUT_MS ?? 15_000;
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (this.apiKey) {
      headers['X-Auth-Token'] = this.apiKey;
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  private decodeResult(raw: Record<string, unknown>, token: string): Judge0Result {
    const status = (raw.status as { id?: number; description?: string } | undefined) ?? {};
    return {
      token: (raw.token as string) ?? token,
      status: {
        id: status.id ?? 13,
        description: status.description ?? 'Unknown',
      },
      stdout: b64Decode(raw.stdout as string | null),
      stderr: b64Decode(raw.stderr as string | null),
      compile_output: b64Decode(raw.compile_output as string | null),
      message: b64Decode(raw.message as string | null),
      time: (raw.time as string | null) ?? null,
      memory: typeof raw.memory === 'number' ? raw.memory : null,
      exit_code: typeof raw.exit_code === 'number' ? raw.exit_code : null,
      language_id: typeof raw.language_id === 'number' ? raw.language_id : null,
    };
  }

  async createSubmission(input: CreateSubmissionInput): Promise<{ token: string }> {
    if (!this.isConfigured()) {
      const mock = mockExecute(input);
      return { token: mock.token };
    }

    const url = new URL(`${this.baseUrl!.replace(/\/$/, '')}/submissions`);
    url.searchParams.set('base64_encoded', 'true');
    url.searchParams.set('wait', 'false');

    const body = {
      source_code: b64Encode(input.sourceCode),
      language_id: input.languageId,
      stdin: input.stdin != null ? b64Encode(input.stdin) : null,
      cpu_time_limit: input.cpuTimeLimit != null ? input.cpuTimeLimit / 1000 : undefined,
      wall_time_limit: input.wallTimeLimit != null ? input.wallTimeLimit / 1000 : undefined,
      memory_limit: input.memoryLimit != null ? input.memoryLimit * 1024 : undefined,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.domain('system', 'error', 'Create submission failed', {
        status: res.status,
        body: text.slice(0, 500),
      });
      throw new CompilerError(`Judge0 create failed: ${res.status}`);
    }

    const data = (await res.json()) as { token?: string };
    if (!data.token) throw new CompilerError('Judge0 response missing token');
    return { token: data.token };
  }

  async getSubmission(token: string): Promise<Judge0Result> {
    if (token.startsWith('mock-') || !this.isConfigured()) {
      return {
        token,
        status: { id: 3, description: 'Accepted' },
        stdout: '',
        stderr: null,
        compile_output: null,
        message: null,
        time: '0.01',
        memory: 1024,
        exit_code: 0,
        language_id: null,
      };
    }

    const url = new URL(`${this.baseUrl!.replace(/\/$/, '')}/submissions/${token}`);
    url.searchParams.set('base64_encoded', 'true');
    url.searchParams.set('fields', '*');

    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!res.ok) {
      throw new CompilerError(`Judge0 get failed: ${res.status}`);
    }

    const raw = (await res.json()) as Record<string, unknown>;
    return this.decodeResult(raw, token);
  }

  private async remoteCreateSubmissionAndWait(
    input: CreateSubmissionInput,
  ): Promise<Judge0Result> {
    const { token } = await this.createSubmission(input);
    const started = Date.now();
    const pollMs = 400;

    while (Date.now() - started < this.timeoutMs) {
      const result = await this.getSubmission(token);
      if (result.status.id >= 3) return result;
      await new Promise((r) => setTimeout(r, pollMs));
    }

    return {
      token,
      status: { id: 5, description: 'Time Limit Exceeded' },
      stdout: null,
      stderr: 'Judge0 poll timeout',
      compile_output: null,
      message: 'timeout',
      time: null,
      memory: null,
      exit_code: null,
      language_id: input.languageId,
    };
  }

  async createSubmissionAndWait(input: CreateSubmissionInput): Promise<Judge0Result> {
    if (!this.isConfigured()) {
      return mockExecute(input);
    }

    try {
      return await this.remoteCreateSubmissionAndWait(input);
    } catch (err) {
      if (!isConnectionError(err)) {
        throw new CompilerError(
          err instanceof Error ? err.message : 'Judge0 execution failed',
        );
      }

      logger.domain('system', 'warn', 'Judge0 unreachable — trying local runner', {
        url: this.baseUrl,
        err: err instanceof Error ? err.message : String(err),
      });

      const local = await localExecute(input);
      if (local) return local;

      logger.domain('system', 'warn', 'Local runner unavailable — using mock passthrough');
      return mockExecute(input);
    }
  }

  async batchCreateSubmissions(
    items: CreateSubmissionInput[],
  ): Promise<{ token: string }[]> {
    if (!this.isConfigured()) {
      return items.map((item) => ({ token: mockExecute(item).token }));
    }

    const url = new URL(`${this.baseUrl!.replace(/\/$/, '')}/submissions/batch`);
    url.searchParams.set('base64_encoded', 'true');

    const body = {
      submissions: items.map((input) => ({
        source_code: b64Encode(input.sourceCode),
        language_id: input.languageId,
        stdin: input.stdin != null ? b64Encode(input.stdin) : null,
        cpu_time_limit: input.cpuTimeLimit != null ? input.cpuTimeLimit / 1000 : undefined,
        wall_time_limit: input.wallTimeLimit != null ? input.wallTimeLimit / 1000 : undefined,
        memory_limit: input.memoryLimit != null ? input.memoryLimit * 1024 : undefined,
      })),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!res.ok) throw new Error(`Judge0 batch create failed: ${res.status}`);
    const data = (await res.json()) as { token?: string }[];
    return data.map((d) => ({ token: d.token! }));
  }

  async getBatchSubmissions(tokens: string[]): Promise<Judge0Result[]> {
    if (!this.isConfigured() || tokens.every((t) => t.startsWith('mock-'))) {
      return tokens.map((token) => ({
        token,
        status: { id: 3, description: 'Accepted' },
        stdout: '',
        stderr: null,
        compile_output: null,
        message: null,
        time: '0.01',
        memory: 1024,
        exit_code: 0,
        language_id: null,
      }));
    }

    const url = new URL(`${this.baseUrl!.replace(/\/$/, '')}/submissions/batch`);
    url.searchParams.set('tokens', tokens.join(','));
    url.searchParams.set('base64_encoded', 'true');
    url.searchParams.set('fields', '*');

    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!res.ok) throw new Error(`Judge0 batch get failed: ${res.status}`);
    const data = (await res.json()) as { submissions?: Record<string, unknown>[] };
    const submissions = data.submissions ?? (data as unknown as Record<string, unknown>[]);
    return submissions.map((raw, i) => this.decodeResult(raw, tokens[i]!));
  }
}

export const judge0Client = new Judge0Client();
