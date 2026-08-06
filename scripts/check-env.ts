/**
 * Validates that local env files exist and contain required keys.
 * Run: pnpm env:check
 *
 * Note: .env / .env.local are gitignored — this checks your local machine only.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const checks: { path: string; required: string[] }[] = [
  {
    path: 'apps/frontend/.env.local',
    required: [
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_API_URL',
      'NEXT_PUBLIC_WS_URL',
      'NEXT_PUBLIC_DEFAULT_LOCALE',
    ],
  },
  {
    path: 'apps/backend/.env',
    required: [
      'PORT',
      'MONGODB_URI',
      'REDIS_URL',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'CORS_ORIGINS',
    ],
  },
  {
    path: 'apps/worker/.env',
    required: ['MONGODB_URI', 'REDIS_URL', 'WORKER_CONCURRENCY'],
  },
];

let failed = false;

for (const check of checks) {
  const full = resolve(root, check.path);
  if (!existsSync(full)) {
    console.error(`Missing: ${check.path}`);
    failed = true;
    continue;
  }
  const content = readFileSync(full, 'utf8');
  for (const key of check.required) {
    if (!new RegExp(`^${key}=`, 'm').test(content)) {
      console.error(`Missing key "${key}" in ${check.path}`);
      failed = true;
    }
  }
  console.log(`OK  ${check.path}`);
}

if (failed) {
  process.exit(1);
}

console.log('Local environment files look good.');
