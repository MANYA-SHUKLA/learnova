/**
 * Complete platform seed — runs all module seeds in dependency order.
 *
 * Usage (from repo root):
 *   pnpm seed:complete
 *
 * From apps/backend:
 *   pnpm seed:complete
 *
 * Options (env):
 *   SEED_INSTITUTION_ID — required (or first institution is used)
 *   SEED_FORCE=1 — force reseed where supported
 *   SEED_SKIP_GRADEBOOK=1 — skip heavy gradebook pass
 *   SEED_SKIP_CERTIFICATES=1 — skip certificate pass
 */

import '../config/load-env.js';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { finalizeDemoStudentRecords } from './demo-data.seed.js';
import { resolveSeedInstitutionId, seedForceEnabled } from './seed-utils.js';
import { Types } from 'mongoose';
import { UserModel } from '../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../..');

const PIPELINE: readonly string[] = [
  'seed:auth',
  'seed:enrollment-stack',
  'seed:course-builder',
  'seed:progress',
  'seed:assignments',
  'seed:practice-labs',
  'seed:projects',
  'seed:quizzes',
  'seed:examinations',
  'seed:demo',
  'seed:demo-data',
  'seed:gradebook',
  'seed:certificates',
];

function runScript(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.info({ script }, 'Running seed step');
    const child = spawn('pnpm', [script], {
      cwd: backendRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...(seedForceEnabled() ? { SEED_FORCE: '1' } : {}),
      },
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code ?? 'unknown'}`));
    });
  });
}

async function main(): Promise<void> {
  const institutionId = process.env.SEED_INSTITUTION_ID?.trim();
  if (!institutionId) {
    await connectMongo();
    await resolveSeedInstitutionId();
    await disconnectMongo();
  }

  const skipGradebook = process.env.SEED_SKIP_GRADEBOOK === '1';
  const skipCertificates = process.env.SEED_SKIP_CERTIFICATES === '1';

  for (const step of PIPELINE) {
    if (skipGradebook && step === 'seed:gradebook') {
      logger.warn('Skipping seed:gradebook (SEED_SKIP_GRADEBOOK=1)');
      continue;
    }
    if (skipCertificates && step === 'seed:certificates') {
      logger.warn('Skipping seed:certificates (SEED_SKIP_CERTIFICATES=1)');
      continue;
    }
    await runScript(step);
  }

  await connectMongo();
  const resolvedInstitutionId = await resolveSeedInstitutionId();
  const user = await UserModel.findOne({ institutionId: new Types.ObjectId(resolvedInstitutionId) })
    .select('_id')
    .lean();
  if (!user) throw new Error('No institution user found for demo finalize');

  logger.info('Finalizing demo student gradebook + certificate records...');
  const finalized = await finalizeDemoStudentRecords(resolvedInstitutionId, String(user._id));
  logger.info(finalized, 'Complete seed finished');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Complete seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
