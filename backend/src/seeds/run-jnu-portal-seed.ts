import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { seedJnuPortalSettings } from './jnu-portal-settings.seed.js';

async function main() {
  await connectMongo();
  await seedJnuPortalSettings();
  logger.info('JNU portal settings seed complete');
  await disconnectMongo();
}

main().catch(async (err) => {
  logger.error({ err }, 'JNU portal seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
