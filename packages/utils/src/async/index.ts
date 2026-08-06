export type AsyncResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: unknown };

/** Wrap async fn to never throw — returns Result */
export async function asyncTry<T>(fn: () => Promise<T>): Promise<AsyncResult<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    return { ok: false, error };
  }
}

export function asyncHandler<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<AsyncResult<TResult>> {
  return (...args) => asyncTry(() => fn(...args));
}
