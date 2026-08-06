import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger/index.js';

/**
 * MongoDB connection layer.
 * Models are NOT created here — connection + lifecycle only.
 */

let isConnected = false;

export async function connectMongo(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info('MongoDB connected');
  });

  mongoose.connection.on('error', (err: Error) => {
    logger.error({ err }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  });

  return mongoose;
}

export async function disconnectMongo(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected cleanly');
}

export function getMongoConnection(): typeof mongoose.connection {
  return mongoose.connection;
}

export function isMongoReady(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
