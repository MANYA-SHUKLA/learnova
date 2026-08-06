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

export default function InstitutionSettingsPage() {
  const { data, isLoading, isError, error, refetch } = useInstitutionSettings();
  const updateMutation = useUpdateInstitutionSettingsMutation();
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('system');
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setLanguage(data.language);
    setTheme(data.theme);
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
    try {
      await updateMutation.mutateAsync({ language, theme });
      setMessage('Settings saved.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save settings.');
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        title="Institution settings"
        description="Tenant defaults for language, theme, and policy JSON blocks."
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
          <PermissionGate permission={PERMISSIONS.INSTITUTION_MANAGE} enforce>
            <div className="sm:col-span-2">
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
            </div>
          </PermissionGate>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Policy blocks</CardTitle>
          <CardDescription>
            Advanced JSON configuration is managed via API. Summary of current keys:
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ['Attendance', data.attendance],
              ['Grading scale', data.gradingScale],
              ['Exam rules', data.examRules],
              ['Certificates', data.certificateSettings],
              ['Storage', data.storageSettings],
              ['AI', data.aiSettings],
              ['Notifications', data.notificationSettings],
              ['Security', data.securitySettings],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {Object.keys(value).length} key(s)
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {message ? <p className="mt-4 text-sm text-success">{message}</p> : null}
      {formError ? <p className="mt-4 text-sm text-danger">{formError}</p> : null}
    </main>
  );
}
