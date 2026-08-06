import { logger } from '../utils/logger/index.js';
import { AppError } from '../utils/errors/index.js';
import type { IStorage, PutObjectInput, StorageObject } from './types.js';

/**
 * S3-compatible storage port.
 * Driver is registered when STORAGE_DRIVER=s3; SDK wiring lands when uploads ship.
 * Callers depend on IStorage — swapping impls does not change feature code.
 */
export class S3Storage implements IStorage {
  readonly driver = 's3' as const;

  constructor(
    private readonly config: {
      bucket?: string;
      region?: string;
      endpoint?: string;
    },
  ) {
    if (!config.bucket) {
      logger.warn('S3 storage selected but S3_BUCKET is unset');
    }
  }

  private notReady(): never {
    throw new AppError(
      'SERVICE_UNAVAILABLE',
      'S3 storage driver is configured but the AWS SDK adapter is not wired yet. Use STORAGE_DRIVER=local for foundation.',
      503,
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
    const base = this.config.endpoint ?? `https://${bucket}.s3.amazonaws.com`;
    return `${base.replace(/\/$/, '')}/${key.replace(/^\/+/, '')}`;
  }

  async isHealthy(): Promise<boolean> {
    // Config present counts as "wired for health"; put/get still gated until SDK lands
    return Boolean(this.config.bucket);
  }
}
