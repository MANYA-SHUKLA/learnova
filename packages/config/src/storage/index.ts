import { z } from 'zod';

/** Expand storage drivers — S3-compatible covers MinIO + R2 */
export const storageConfigSchema = z.object({
  STORAGE_DRIVER: z.enum(['local', 's3', 'minio', 'r2']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  /** MinIO / R2 often need path-style + custom endpoint */
  S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).default('false'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
});

export type StorageConfig = z.infer<typeof storageConfigSchema>;
