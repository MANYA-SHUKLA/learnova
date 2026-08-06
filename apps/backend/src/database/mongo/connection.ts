import mongoose from 'mongoose';
import { sleep } from '@learnova/utils';
import { databaseConfig } from '../../config/slices.js';
import { logger } from '../../utils/logger/index.js';
import { DatabaseError } from '../../utils/errors/index.js';

/**
 * MongoDB connection manager.
 * Models are NOT created here — connection + lifecycle + metrics only.
 */

let isConnected = false;
let connectAttempts = 0;
let lastConnectedAt: string | null = null;
let lastError: string | null = null;

export interface MongoMetrics {
  readyState: number;
  isConnected: boolean;
  connectAttempts: number;
  lastConnectedAt: string | null;
  lastError: string | null;
  pool: {
    maxPoolSize: number;
    minPoolSize: number;
  };
}

export async function connectMongo(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    isConnected = true;
    lastConnectedAt = new Date().toISOString();
    lastError = null;
    logger.domain('database', 'info', 'MongoDB connected');
  });

  mongoose.connection.on('error', (err: Error) => {
    lastError = err.message;
    logger.domain('database', 'error', 'MongoDB connection error', { err });
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.domain('database', 'warn', 'MongoDB disconnected — awaiting reconnect');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    lastConnectedAt = new Date().toISOString();
    logger.domain('database', 'info', 'MongoDB reconnected');
  });

  const maxAttempts = databaseConfig.retryAttempts;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    connectAttempts = attempt;
    try {
      await mongoose.connect(databaseConfig.uri, {
        dbName: databaseConfig.dbName,
        maxPoolSize: databaseConfig.maxPoolSize,
        minPoolSize: databaseConfig.minPoolSize,
        serverSelectionTimeoutMS: databaseConfig.serverSelectionTimeoutMS,
        socketTimeoutMS: databaseConfig.socketTimeoutMS,
      });
      isConnected = true;
      return mongoose;
    } catch (err) {
      lastErr = err;
      lastError = err instanceof Error ? err.message : String(err);
      logger.domain('database', 'warn', 'MongoDB connect attempt failed', {
        attempt,
        maxAttempts,
        err,
      });
      if (attempt < maxAttempts) {
        await sleep(databaseConfig.retryDelayMs * attempt);
      }
    }
  }

  throw new DatabaseError('Failed to connect to MongoDB after retries', {
    attempts: maxAttempts,
    cause: lastErr instanceof Error ? lastErr.message : String(lastErr),
  });
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.domain('database', 'info', 'MongoDB disconnected cleanly');
}

export function getMongoConnection(): typeof mongoose.connection {
  return mongoose.connection;
}

export function isMongoReady(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function isMongoLive(): boolean {
  return mongoose.connection.readyState !== 0;
}

export function getMongoMetrics(): MongoMetrics {
  return {
    readyState: mongoose.connection.readyState,
    isConnected: isMongoReady(),
    connectAttempts,
    lastConnectedAt,
    lastError,
    pool: {
      maxPoolSize: databaseConfig.maxPoolSize,
      minPoolSize: databaseConfig.minPoolSize,
    },
  };
}
