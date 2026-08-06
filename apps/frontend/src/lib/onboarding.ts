/**
 * Institution setup / onboarding helpers (no client storage).
 */

import type { Institution } from '@learnova/types';
import { ApiClientError } from '@/lib/api/client';

export function isInstitutionNotFound(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 404;
}

/** Setup is complete when the institution record exists with core profile fields. */
export function isInstitutionSetupComplete(institution: Institution | null | undefined): boolean {
  if (!institution) return false;
  return (
    Boolean(institution.name?.trim()) &&
    Boolean(institution.shortName?.trim()) &&
    Boolean(institution.email?.trim()) &&
    Boolean(institution.country?.trim()) &&
    Boolean(institution.timezone?.trim()) &&
    Boolean(institution.phone?.trim() || institution.address?.trim())
  );
}

export function slugifyInstitution(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function codeFromName(name: string): string {
  const letters = name
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 8);
  return letters.length >= 2
    ? letters
    : name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) || 'INST';
}

export function shortNameFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0]!.slice(0, 12);
  return words
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 12);
}
