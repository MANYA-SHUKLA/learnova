/**
 * Sync MongoDB indexes for all registered models.
 * Usage: pnpm db:indexes
 */

import '../config/load-env.js';
import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import * as models from '../models/index.js';

async function main() {
  await connectMongo();
  const modelExports = Object.values(models).filter(
    (value): value is mongoose.Model<unknown> =>
      typeof value === 'function' &&
      'syncIndexes' in value &&
      typeof (value as mongoose.Model<unknown>).syncIndexes === 'function',
  );

  console.log(`Syncing indexes for ${modelExports.length} models…\n`);

  for (const model of modelExports) {
    const name = model.modelName;
    try {
      await model.syncIndexes();
      console.log(`  ${name}: OK`);
    } catch (err) {
      console.error(`  ${name}: FAIL`, err);
      process.exitCode = 1;
    }
  }

  await disconnectMongo();
  console.log('\nIndex sync complete.\n');
}

main().catch(async (err: unknown) => {
  console.error(err);
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
