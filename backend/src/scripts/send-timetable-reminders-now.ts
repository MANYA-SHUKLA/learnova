/**
 * Manually trigger daily class reminder emails (dev / ops).
 * Usage: pnpm --filter @learnova/backend reminders:timetable
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { timetableService } from '../services/timetable/timetable.service.js';
import { logger } from '../utils/logger/index.js';

async function main(): Promise<void> {
  await connectMongo();
  try {
    const result = await timetableService.sendDailyClassReminders();
    logger.info(result, 'Timetable reminders sent');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await disconnectMongo();
  }
}

main().catch((err) => {
  logger.error({ err }, 'Failed to send timetable reminders');
  process.exit(1);
});
