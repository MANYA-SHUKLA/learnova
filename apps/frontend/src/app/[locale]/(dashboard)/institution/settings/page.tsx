'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
  Spinner,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  useInstitutionSettings,
  useUpdateInstitutionSettingsMutation,
} from '@/features/institution';
import { useMountedTheme } from '@/hooks/use-theme';

const POLICY_KEYS = [
  'attendance',
  'gradingScale',
  'examRules',
  'certificateSettings',
  'storageSettings',
  'aiSettings',
  'notificationSettings',
  'securitySettings',
] as const;

type PolicyKey = (typeof POLICY_KEYS)[number];
type ThemePreference = 'light' | 'dark' | 'system';

function stringifyPolicy(value: Record<string, unknown>): string {
  return JSON.stringify(value, null, 2);
}

function normalizeTheme(value: string | undefined | null): ThemePreference {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'system';
}

export default function InstitutionSettingsPage() {
  const t = useTranslations('dashboard.institution.settings');
  const tCrud = useTranslations('dashboard.institution.crud');
  const { data, isLoading, isError, error, refetch } = useInstitutionSettings();
  const updateMutation = useUpdateInstitutionSettingsMutation();
  const { theme: clientTheme, setTheme: setClientTheme, mounted } = useMountedTheme();
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [policies, setPolicies] = useState<Record<PolicyKey, string>>({
    attendance: '{}',
    gradingScale: '{}',
    examRules: '{}',
    certificateSettings: '{}',
    storageSettings: '{}',
    aiSettings: '{}',
    notificationSettings: '{}',
    securitySettings: '{}',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [hydratedFromServer, setHydratedFromServer] = useState(false);

  useEffect(() => {
    if (!data) return;
    setLanguage(data.language);
    const nextTheme = normalizeTheme(data.theme);
    setTheme(nextTheme);
    setPolicies({
      attendance: stringifyPolicy(data.attendance),
      gradingScale: stringifyPolicy(data.gradingScale),
      examRules: stringifyPolicy(data.examRules),
      certificateSettings: stringifyPolicy(data.certificateSettings),
      storageSettings: stringifyPolicy(data.storageSettings),
      aiSettings: stringifyPolicy(data.aiSettings),
      notificationSettings: stringifyPolicy(data.notificationSettings),
      securitySettings: stringifyPolicy(data.securitySettings),
    });
    setHydratedFromServer(true);
  }, [data]);

  // Apply saved institution theme once after load (does not fight manual toggle afterwards).
  useEffect(() => {
    if (!mounted || !hydratedFromServer || !data) return;
    const saved = normalizeTheme(data.theme);
    if (clientTheme !== saved) {
      setClientTheme(saved);
    }
    // Only on first hydration from server settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot sync
  }, [mounted, hydratedFromServer, data?.theme]);

  if (isLoading) {
    return (
      <div className="w-full min-w-0">
        <Skeleton className="mb-6 h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full min-w-0">
        <ErrorState
          message={error instanceof Error ? error.message : t('loadFailed')}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full min-w-0">
        <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
      </div>
    );
  }

  const onThemeChange = (next: ThemePreference) => {
    setTheme(next);
    setClientTheme(next);
  };

  const save = async () => {
    setFormError(null);
    setMessage(null);
    const parsed: Record<string, Record<string, unknown>> = {};
    try {
      for (const key of POLICY_KEYS) {
        parsed[key] = JSON.parse(policies[key] || '{}') as Record<string, unknown>;
      }
    } catch {
      setFormError(t('invalidJson'));
      return;
    }
    try {
      await updateMutation.mutateAsync({
        language,
        theme,
        attendance: parsed['attendance'],
        gradingScale: parsed['gradingScale'],
        examRules: parsed['examRules'],
        certificateSettings: parsed['certificateSettings'],
        storageSettings: parsed['storageSettings'],
        aiSettings: parsed['aiSettings'],
        notificationSettings: parsed['notificationSettings'],
        securitySettings: parsed['securitySettings'],
      });
      setClientTheme(theme);
      setMessage(t('saved'));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('saveFailed'));
    }
  };

  return (
    <div className="w-full min-w-0">
      <PageHeader title={t('title')} description={t('description')} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('preferences')}</CardTitle>
          <CardDescription>{t('preferencesDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="language">
              {t('language')}
            </label>
            <Input
              id="language"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
              }}
              placeholder="en"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="theme">
              {t('theme')}
            </label>
            <select
              id="theme"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              value={theme}
              onChange={(e) => {
                onThemeChange(normalizeTheme(e.target.value));
              }}
            >
              <option value="system">{t('themeSystem')}</option>
              <option value="light">{t('themeLight')}</option>
              <option value="dark">{t('themeDark')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('policyBlocks')}</CardTitle>
          <CardDescription>{t('policyBlocksDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {POLICY_KEYS.map((key) => (
            <div key={key} className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor={key}>
                {t(`policies.${key}`)}
              </label>
              <textarea
                id={key}
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs text-foreground"
                value={policies[key]}
                onChange={(e) => {
                  setPolicies((prev) => ({ ...prev, [key]: e.target.value }));
                }}
                spellCheck={false}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <PermissionGate permission={PERMISSIONS.INSTITUTION_MANAGE} enforce>
        <Button type="button" disabled={updateMutation.isPending} onClick={() => void save()}>
          {updateMutation.isPending ? (
            <>
              <Spinner size="sm" />
              {tCrud('saving')}
            </>
          ) : (
            t('saveSettings')
          )}
        </Button>
      </PermissionGate>

      {message ? <p className="mt-4 text-sm text-success">{message}</p> : null}
      {formError ? <p className="mt-4 text-sm text-danger">{formError}</p> : null}
    </div>
  );
}
