/**
 * Institution onboarding helpers — progress steps + draft profile from registration.
 */

import type { Institution } from '@learnova/types';
import { ApiClientError } from '@/lib/api/client';

export const ONBOARDING_PROFILE_KEY = 'learnova_onboarding_profile';

export interface OnboardingProfileDraft {
  name?: string;
  code?: string;
  email?: string;
  phone?: string;
  country?: string;
  timezone?: string;
}

export type OnboardingStepId = 'create' | 'profile' | 'manage';

export interface OnboardingProgress {
  currentStep: OnboardingStepId;
  completed: Record<OnboardingStepId, boolean>;
  /** True when create + profile are done (manage may still be pending). */
  isReadyToManage: boolean;
  /** Hide the stepper once the institution has real structure. */
  isComplete: boolean;
}

export function readOnboardingDraft(): OnboardingProfileDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ONBOARDING_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingProfileDraft;
  } catch {
    return null;
  }
}

export function clearOnboardingDraft() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ONBOARDING_PROFILE_KEY);
}

export function isInstitutionNotFound(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 404;
}

export function isProfileConfigured(institution: Institution): boolean {
  const hasBasics =
    Boolean(institution.name?.trim()) &&
    Boolean(institution.shortName?.trim()) &&
    Boolean(institution.email?.trim()) &&
    Boolean(institution.country?.trim()) &&
    Boolean(institution.timezone?.trim());
  const hasLocationOrContact =
    Boolean(institution.city?.trim()) ||
    Boolean(institution.address?.trim()) ||
    Boolean(institution.phone?.trim()) ||
    Boolean(institution.website?.trim()) ||
    Boolean(institution.logo);
  return hasBasics && hasLocationOrContact;
}

export function getOnboardingProgress(opts: {
  institution?: Institution | null;
  institutionMissing: boolean;
  campusCount: number;
}): OnboardingProgress {
  const created = Boolean(opts.institution) && !opts.institutionMissing;
  const profile = created && opts.institution ? isProfileConfigured(opts.institution) : false;
  const manage = created && profile && opts.campusCount > 0;

  const completed = {
    create: created,
    profile,
    manage,
  };

  let currentStep: OnboardingStepId = 'create';
  if (!created) currentStep = 'create';
  else if (!profile) currentStep = 'profile';
  else currentStep = 'manage';

  return {
    currentStep,
    completed,
    isReadyToManage: created && profile,
    isComplete: manage,
  };
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
  return letters.length >= 2 ? letters : name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) || 'INST';
}
