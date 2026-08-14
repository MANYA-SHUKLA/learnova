/**
 * Verify Judge0 connectivity and a sample Python run.
 * Usage: pnpm --filter @learnova/backend judge0:verify
 */

import '../config/load-env.js';
import { judge0Client } from '../services/coding-engine/judge0.client.js';

const API = process.env.JUDGE0_API_URL?.trim();

async function main(): Promise<void> {
  if (!API) {
    console.error('FAIL — set JUDGE0_API_URL in backend/.env (e.g. http://localhost:2358)');
    console.error('Start Judge0: pnpm docker:judge0');
    process.exit(1);
  }

  const aboutRes = await fetch(`${API.replace(/\/$/, '')}/about`);
  if (!aboutRes.ok) {
    console.error(`FAIL — GET ${API}/about → HTTP ${aboutRes.status}`);
    console.error('Is Judge0 running? Try: pnpm docker:judge0');
    process.exit(1);
  }
  console.log(`OK  Judge0 /about → HTTP ${aboutRes.status}`);

  if (!judge0Client.isConfigured()) {
    console.error('FAIL — judge0 client not configured');
    process.exit(1);
  }

  const result = await judge0Client.createSubmissionAndWait({
    sourceCode: 'print(42)',
    languageId: 71,
    stdin: '',
    cpuTimeLimit: 2000,
    wallTimeLimit: 5000,
    memoryLimit: 256,
  });

  const stdout = result.stdout?.trim();
  if (result.status.id === 3 && stdout === '42') {
    console.log('OK  Python submission → stdout 42');
    console.log('Judge0 is ready for Practice Labs.');
    return;
  }

  console.error('FAIL — unexpected Judge0 result', {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    compile: result.compile_output,
  });
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error('FAIL —', err instanceof Error ? err.message : err);
  console.error('Start Judge0: pnpm docker:judge0');
  process.exit(1);
});
