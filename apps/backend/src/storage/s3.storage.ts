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

  async put(_input: PutObjectInput): Promise<StorageObject> {
    this.notReady();
  }

  async get(_key: string): Promise<Buffer> {
    this.notReady();
  }

  async delete(_key: string): Promise<void> {
    this.notReady();
  }

  async exists(_key: string): Promise<boolean> {
    this.notReady();
  }

  async getPublicUrl(key: string): Promise<string> {
    const bucket = this.config.bucket ?? 'bucket';
    if (this.config.endpoint) {
      const base = this.config.endpoint.replace(/\/$/, '');
      return this.config.forcePathStyle
        ? `${base}/${bucket}/${key.replace(/^\/+/, '')}`
        : `${base}/${key.replace(/^\/+/, '')}`;
    }
    return `https://${bucket}.s3.amazonaws.com/${key.replace(/^\/+/, '')}`;
  }

  async isHealthy(): Promise<boolean> {
    return Boolean(this.config.bucket);
  }
}

/** @deprecated Use S3CompatibleStorage — kept for existing imports */
export class S3Storage extends S3CompatibleStorage {
  constructor(config: { bucket?: string; region?: string; endpoint?: string }) {
    super('s3', config);
  }
}
