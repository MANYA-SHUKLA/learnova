import { workerEnvSchema, parseEnv, type WorkerEnv } from '@learnova/config';

let cached: WorkerEnv | null = null;

export function getEnv(): WorkerEnv {
  if (!cached) {
    cached = parseEnv(workerEnvSchema);
  }
  return cached;
}

export const env = new Proxy({} as WorkerEnv, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof WorkerEnv];
  },
});
