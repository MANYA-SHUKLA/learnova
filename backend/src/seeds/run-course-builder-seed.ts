/**
 * Seed course builder data (modules, lessons, resources) for existing courses.
 *
 * Usage: pnpm --filter @learnova/backend seed:course-builder
 */

import '../config/load-env.js';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { logger } from '../utils/logger/index.js';
import { seedCourseBuilder } from './course-builder.seed.js';
import { getSeedCounts, resolveSeedInstitutionId } from './seed-utils.js';

async function main(): Promise<void> {
  await connectMongo();

  const institutionId = process.env.SEED_INSTITUTION_ID?.trim() ?? (await resolveSeedInstitutionId());
  const counts = getSeedCounts();

  logger.info({ institutionId }, 'Using institution ID for course builder seed');

  await seedCourseBuilder(institutionId, {
    targetCourseCount: counts.courseBuilderCourses,
    modulesPerCourse: counts.modulesPerCourse,
    lessonsPerModule: counts.lessonsPerModule,
  });

  logger.info('Course builder seed completed successfully');
  await disconnectMongo();
}

main().catch(async (err: unknown) => {
  logger.error({ err }, 'Course builder seed failed');
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
