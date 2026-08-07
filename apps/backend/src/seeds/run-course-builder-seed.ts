#!/usr/bin/env node
/**
 * Seed course builder data (modules, lessons, resources) for existing courses.
 * Requires: SEED_INSTITUTION_ID env variable (or uses default)
 *
 * Usage:
 *   npm run seed:course-builder
 */

import { connect, disconnect } from 'mongoose';
import { seedCourseBuilder } from './course-builder.seed.js';
import { logger } from '../utils/logger/index.js';

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/learnova_dev';
    logger.info(`Connecting to MongoDB: ${mongoUri}`);
    await connect(mongoUri);

    const institutionId = process.env.SEED_INSTITUTION_ID || '507f1f77bcf86cd799439011';
    logger.info(`Using institution ID: ${institutionId}`);

    await seedCourseBuilder(institutionId);

    logger.info('Course builder seed completed successfully');
    await disconnect();
    process.exit(0);
  } catch (err) {
    logger.error('Course builder seed failed', { error: err });
    await disconnect();
    process.exit(1);
  }
}

run();
