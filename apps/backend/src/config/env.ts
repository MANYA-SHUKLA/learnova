import { backendEnvSchema, parseEnv, type BackendEnv } from '@learnova/config';

let cached: BackendEnv | null = null;

export function getEnv(): BackendEnv {
  cached ??= parseEnv(backendEnvSchema);
  return cached;
}

export const env = new Proxy({} as BackendEnv, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof BackendEnv];
  },
});
