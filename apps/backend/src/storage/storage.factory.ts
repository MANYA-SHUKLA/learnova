import { env } from '../config/env.js';
import { logger } from '../utils/logger/index.js';
import { LocalStorage } from './local.storage.js';
import { S3Storage } from './s3.storage.js';
import type { IStorage } from './types.js';

let storage: IStorage | null = null;

export function createStorage(): IStorage {
  const driver = env.STORAGE_DRIVER ?? 'local';

  if (driver === 's3') {
    logger.info({ driver: 's3', bucket: env.S3_BUCKET }, 'Storage driver: s3');
    return new S3Storage({
      bucket: env.S3_BUCKET,
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
    });
  }

  logger.info({ driver: 'local', path: env.STORAGE_LOCAL_PATH }, 'Storage driver: local');
  return new LocalStorage(env.STORAGE_LOCAL_PATH);
}

export function getStorage(): IStorage {
  if (!storage) {
    storage = createStorage();
  }
  return storage;
}

export function resetStorageForTests(): void {
  storage = null;
}
