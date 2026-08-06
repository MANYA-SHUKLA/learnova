export * from './date/index.js';
export * from './time/index.js';
export * from './pagination/index.js';
export * from './search/index.js';
export * from './uuid/index.js';
export * from './file/index.js';
export * from './encryption/index.js';
export * from './slug/index.js';
export * from './csv/index.js';
export * from './pdf/index.js';
export * from './retry/index.js';
export * from './async/index.js';
export * from './cursor/index.js';

export function assertNever(value: never, message = 'Unexpected value'): never {
  throw new Error(`${message}: ${String(value)}`);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}
