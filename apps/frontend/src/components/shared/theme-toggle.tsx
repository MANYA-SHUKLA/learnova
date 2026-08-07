'use client';

import { Button } from '@learnova/ui';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMountedTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
  const t = useTranslations('common');
  const { resolvedTheme, setTheme, mounted } = useMountedTheme();

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={!mounted}
      aria-label={isDark ? t('themeLight') : t('themeDark')}
      title={isDark ? t('themeLight') : t('themeDark')}
      onClick={() => {
        setTheme(isDark ? 'light' : 'dark');
      }}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
