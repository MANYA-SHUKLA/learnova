/**
 * Feature flags — env-driven defaults for foundation.
 * Replace with remote config (Redis/LaunchDarkly) later without changing call sites.
 */

export const FEATURE_FLAGS = {
  ENABLE_AI: 'ENABLE_AI',
  ENABLE_CHAT: 'ENABLE_CHAT',
  ENABLE_PROCTORING: 'ENABLE_PROCTORING',
  ENABLE_GPU: 'ENABLE_GPU',
  ENABLE_CODE_RUNNER: 'ENABLE_CODE_RUNNER',
  ENABLE_IDE: 'ENABLE_IDE',
  ENABLE_ANALYTICS: 'ENABLE_ANALYTICS',
  ENABLE_AUDIT_LOGS: 'ENABLE_AUDIT_LOGS',
  ENABLE_WEBHOOKS: 'ENABLE_WEBHOOKS',
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

/** Safe defaults for local/dev — all optional capabilities off until wired */
export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlag, boolean> = {
  ENABLE_AI: false,
  ENABLE_CHAT: false,
  ENABLE_PROCTORING: false,
  ENABLE_GPU: false,
  ENABLE_CODE_RUNNER: false,
  ENABLE_IDE: false,
  ENABLE_ANALYTICS: true,
  ENABLE_AUDIT_LOGS: true,
  ENABLE_WEBHOOKS: false,
};

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export type FeatureFlagMap = Record<FeatureFlag, boolean>;

export function resolveFeatureFlags(
  env: NodeJS.ProcessEnv = process.env,
): FeatureFlagMap {
  const flags = { ...FEATURE_FLAG_DEFAULTS };
  for (const key of Object.values(FEATURE_FLAGS)) {
    flags[key] = parseBool(env[key], FEATURE_FLAG_DEFAULTS[key]);
  }
  return flags;
}

export function isFeatureEnabled(
  flag: FeatureFlag,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return parseBool(env[flag], FEATURE_FLAG_DEFAULTS[flag]);
}
