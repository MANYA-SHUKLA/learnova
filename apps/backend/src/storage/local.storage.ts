import { mkdir, readFile, unlink, writeFile, access, constants } from 'node:fs/promises';
import path from 'node:path';
import { sanitizeFilename } from '@learnova/utils';
import { env } from '../config/env.js';
import { logger } from '../utils/logger/index.js';
import type { IStorage, PutObjectInput, StorageObject } from './types.js';

function normalizeKey(key: string): string {
  const cleaned = key.replace(/^\/+/, '').replace(/\.\./g, '');
  const parts = cleaned.split('/').map((p) => sanitizeFilename(p));
  return parts.join('/');
}

export class LocalStorage implements IStorage {
  readonly driver = 'local' as const;
  private readonly root: string;

  constructor(rootPath = env.STORAGE_LOCAL_PATH ?? './uploads') {
    this.root = path.resolve(rootPath);
  }

  private resolve(key: string): string {
    const full = path.resolve(this.root, normalizeKey(key));
    if (!full.startsWith(this.root)) {
      throw new Error('Invalid storage key — path escape blocked');
    }
    return full;
  }

  async put(input: PutObjectInput): Promise<StorageObject> {
    const key = normalizeKey(input.key);
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    const body = typeof input.body === 'string' ? Buffer.from(input.body) : Buffer.from(input.body);
    await writeFile(full, body);
    logger.debug({ key, size: body.byteLength, driver: this.driver }, 'Stored object');
    return {
      key,
      size: body.byteLength,
      contentType: input.contentType,
      url: await this.getPublicUrl(key),
    };
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolve(key));
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolve(key), constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): Promise<string> {
    // Local driver — path reference only (serve via static/CDN later)
    return Promise.resolve(`file://${this.resolve(key)}`);
  }

  async isHealthy(): Promise<boolean> {
    try {
      await mkdir(this.root, { recursive: true });
      await access(this.root, constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}
