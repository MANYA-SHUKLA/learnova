import { randomUUID } from 'node:crypto';
import { REGEX } from '@learnova/constants';

export function createId(): string {
  return randomUUID();
}

export function isUuid(value: string): boolean {
  return REGEX.UUID.test(value);
}

export function isObjectId(value: string): boolean {
  return REGEX.OBJECT_ID.test(value);
}
