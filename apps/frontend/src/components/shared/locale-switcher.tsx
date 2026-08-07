'use client';

import { Button } from '@learnova/ui';
import { Languages } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { locales, type AppLocale } from '@/lib/i18n/config';
import { usePathname, useRouter } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'EN',
  hi: 'HI',
  te: 'TE',
};

const LOCALE_NAMES: Record<AppLocale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  te: 'తెలుగు',
};

type LocaleSwitcherProps = {
  className?: string;
  size?: 'sm' | 'icon';
};

export function LocaleSwitcher({ className, size = 'sm' }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  function switchLocale(next: AppLocale) {
    setOpen(false);
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div className={cn('relative', className)} ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        size={size === 'icon' ? 'icon' : 'sm'}
        className={cn(size === 'sm' && 'gap-1.5 rounded-xl px-2.5')}
        aria-label="Switch language"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
        }}
      >
        <Languages className="size-4" />
        {size === 'sm' ? (
          <span className="text-xs font-semibold">{LOCALE_LABELS[locale]}</span>
        ) : null}
      </Button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[148px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-soft-md">
          {locales.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                switchLocale(code);
              }}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                code === locale && 'bg-muted font-medium text-primary',
              )}
            >
              <span>{LOCALE_NAMES[code]}</span>
              <span className="text-xs text-muted-foreground">{LOCALE_LABELS[code]}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
