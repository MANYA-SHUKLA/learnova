import { sleep } from '../time/index.js';

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
  factor?: number;
  onRetry?: (err: unknown, attempt: number) => void;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const factor = options.factor ?? 2;
  let delay = options.delayMs ?? 200;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      options.onRetry?.(err, attempt);
      if (attempt < attempts) {
        await sleep(delay);
        delay *= factor;
      }
    }
  }

  throw lastErr;
}
