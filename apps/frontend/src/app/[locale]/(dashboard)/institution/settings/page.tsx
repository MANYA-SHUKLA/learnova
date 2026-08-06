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
import { useEffect, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  useInstitutionSettings,
  useUpdateInstitutionSettingsMutation,
} from '@/features/institution';

const POLICY_KEYS = [
  ['attendance', 'Attendance'],
  ['gradingScale', 'Grading scale'],
  ['examRules', 'Exam rules'],
  ['certificateSettings', 'Certificate settings'],
  ['storageSettings', 'Storage settings'],
  ['aiSettings', 'AI settings'],
  ['notificationSettings', 'Notification settings'],
  ['securitySettings', 'Security settings'],
] as const;

type PolicyKey = (typeof POLICY_KEYS)[number][0];

function stringifyPolicy(value: Record<string, unknown>): string {
  return JSON.stringify(value ?? {}, null, 2);
}

export default function InstitutionSettingsPage() {
  const { data, isLoading, isError, error, refetch } = useInstitutionSettings();
  const updateMutation = useUpdateInstitutionSettingsMutation();
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('system');
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

  useEffect(() => {
    if (!data) return;
    setLanguage(data.language);
    setTheme(data.theme);
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
  }, [data]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Skeleton className="mb-6 h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load settings.'}
          onRetry={() => void refetch()}
        />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <EmptyState title="No settings" description="Settings record was not found." />
      </main>
    );
  }

  const save = async () => {
    setFormError(null);
    setMessage(null);
    const parsed: Record<string, Record<string, unknown>> = {};
    try {
      for (const [key] of POLICY_KEYS) {
        parsed[key] = JSON.parse(policies[key] || '{}') as Record<string, unknown>;
      }
    } catch {
      setFormError('One or more policy blocks contain invalid JSON.');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        language,
        theme,
        attendance: parsed.attendance,
        gradingScale: parsed.gradingScale,
        examRules: parsed.examRules,
        certificateSettings: parsed.certificateSettings,
        storageSettings: parsed.storageSettings,
        aiSettings: parsed.aiSettings,
        notificationSettings: parsed.notificationSettings,
        securitySettings: parsed.securitySettings,
      });
      setMessage('Settings saved.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save settings.');
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        title="Institution settings"
        description="Language, theme, attendance, grading, exams, certificates, storage, AI, notifications, and security."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
          <CardDescription>Primary locale and UI theme preference.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="language">
              Language
            </label>
            <Input
              id="language"
              value={language}
              onChange={(e) => { setLanguage(e.target.value); }}
              placeholder="en"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="theme">
              Theme
            </label>
            <select
              id="theme"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={theme}
              onChange={(e) => { setTheme(e.target.value); }}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Policy blocks</CardTitle>
          <CardDescription>
            JSON configuration for operational policies. Invalid JSON blocks save attempts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {POLICY_KEYS.map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor={key}>
                {label}
              </label>
              <textarea
                id={key}
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs"
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
              Saving…
            </>
          ) : (
            'Save settings'
          )}
        </Button>
      </PermissionGate>

      {message ? <p className="mt-4 text-sm text-success">{message}</p> : null}
      {formError ? <p className="mt-4 text-sm text-danger">{formError}</p> : null}
    </main>
  );
}
