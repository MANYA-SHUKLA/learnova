import { logger } from '../utils/logger/index.js';
import { StorageError } from '../utils/errors/index.js';
import type { IStorage, PutObjectInput, StorageDriver, StorageObject } from './types.js';

/**
 * S3-compatible port used by AWS S3, MinIO, and Cloudflare R2.
 * SDK wiring lands when uploads ship — abstraction is ready now.
 */
export class S3CompatibleStorage implements IStorage {
  constructor(
    readonly driver: Extract<StorageDriver, 's3' | 'minio' | 'r2'>,
    private readonly config: {
      bucket?: string;
      region?: string;
      endpoint?: string;
      forcePathStyle?: boolean;
    },
  ) {
    if (!config.bucket) {
      logger.warn({ driver: this.driver }, 'Object storage selected but bucket is unset');
    }
  }

  private notReady(): never {
    throw new StorageError(
      `${this.driver} storage adapter is configured but the SDK is not wired yet. Use STORAGE_DRIVER=local for foundation.`,
      { driver: this.driver },
    );
  }

  put(_input: PutObjectInput): Promise<StorageObject> {
    return this.notReady();
  }

  get(_key: string): Promise<Buffer> {
    return this.notReady();
  }

  delete(_key: string): Promise<void> {
    return this.notReady();
  }

  exists(_key: string): Promise<boolean> {
    return this.notReady();
  }

  getPublicUrl(key: string): Promise<string> {
    const bucket = this.config.bucket ?? 'bucket';
    if (this.config.endpoint) {
      const base = this.config.endpoint.replace(/\/$/, '');
      return Promise.resolve(
        this.config.forcePathStyle
          ? `${base}/${bucket}/${key.replace(/^\/+/, '')}`
          : `${base}/${key.replace(/^\/+/, '')}`,
      );
    }
    return Promise.resolve(`https://${bucket}.s3.amazonaws.com/${key.replace(/^\/+/, '')}`);
  }

  isHealthy(): Promise<boolean> {
    return Promise.resolve(Boolean(this.config.bucket));
  }
}

/** Alias kept for existing imports — prefer S3CompatibleStorage */
export class S3Storage extends S3CompatibleStorage {
  constructor(config: { bucket?: string; region?: string; endpoint?: string }) {
    super('s3', config);
  }
}
