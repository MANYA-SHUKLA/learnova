/**
 * Print institution ids for seed env setup.
 * Usage: pnpm exec tsx --env-file=.env src/seeds/list-institutions.ts
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { InstitutionModel } from '../models/index.js';

async function main(): Promise<void> {
  await connectMongo();
  const docs = await InstitutionModel.find({ deletedAt: null })
    .select('_id name slug code')
    .limit(20)
    .lean();

  if (docs.length === 0) {
    console.log('No institutions found. Create one in the UI first, then re-run.');
  } else {
    for (const d of docs) {
      console.log(`${String(d._id)}\t${d.code ?? ''}\t${d.slug ?? ''}\t${d.name ?? ''}`);
    }
  }

  await disconnectMongo();
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
