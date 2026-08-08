import { storageConfig } from '../config/slices.js';
import { logger } from '../utils/logger/index.js';
import { LocalStorage } from './local.storage.js';
import { S3CompatibleStorage } from './s3.storage.js';
import type { IStorage } from './types.js';

let storage: IStorage | null = null;

export function createStorage(): IStorage {
  const driver = storageConfig.driver;

  if (driver === 's3' || driver === 'minio' || driver === 'r2') {
    logger.info(
      { driver, bucket: storageConfig.bucket, endpoint: storageConfig.endpoint },
      'Storage driver (S3-compatible)',
    );
    return new S3CompatibleStorage(driver, {
      bucket: storageConfig.bucket,
      region: storageConfig.region,
      endpoint: storageConfig.endpoint,
      forcePathStyle: storageConfig.forcePathStyle || driver === 'minio',
    });
  }

  logger.info({ driver: 'local', path: storageConfig.localPath }, 'Storage driver: local');
  return new LocalStorage(storageConfig.localPath);
}

export function getStorage(): IStorage {
  storage ??= createStorage();
  return storage;
}

export function resetStorageForTests(): void {
  storage = null;
}
