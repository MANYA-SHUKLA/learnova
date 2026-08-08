import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Load apps/backend/.env before config validation.
 * Prefer Node's built-in loader; fall back to no-op if missing.
 */
const envPath = resolve(process.cwd(), '.env');

if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}
