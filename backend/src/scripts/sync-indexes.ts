/**
 * Sync MongoDB indexes for all registered models.
 * Usage: pnpm db:indexes
 */

import '../config/load-env.js';
import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import '../models/index.js';

async function main() {
  await connectMongo();

  const modelNames = Object.keys(mongoose.models);
  console.log(`Syncing indexes for ${modelNames.length} models…\n`);

  for (const name of modelNames.sort()) {
    const model = mongoose.models[name];
    if (!model) continue;
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
