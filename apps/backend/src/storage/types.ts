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

/**
 * File storage port — swap local ↔ S3 without changing callers.
 */
export interface IStorage {
  readonly driver: 'local' | 's3';
  put(input: PutObjectInput): Promise<StorageObject>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getPublicUrl(key: string): Promise<string>;
  /** Ready check for health probes */
  isHealthy(): Promise<boolean>;
}
