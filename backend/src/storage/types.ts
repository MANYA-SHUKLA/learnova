export interface StorageObject {
  key: string;
  size: number;
  contentType?: string;
  etag?: string;
  url?: string;
}

export interface PutObjectInput {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface SignedUrlOptions {
  expiresInSeconds?: number;
}

export type StorageDriver = 'local' | 's3' | 'minio' | 'r2';

/**
 * File storage port — Local / MinIO / S3 / R2.
 * Abstraction only — no upload HTTP API.
 */
export interface IStorage {
  readonly driver: StorageDriver;
  put(input: PutObjectInput): Promise<StorageObject>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getPublicUrl(key: string): Promise<string>;
  isHealthy(): Promise<boolean>;
}
