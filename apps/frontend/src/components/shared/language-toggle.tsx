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

interface LanguageToggleProps {
  className?: string;
  size?: 'sm' | 'icon';
}

export function LanguageToggle({ className, size = 'sm' }: LanguageToggleProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const switchLocale = (next: AppLocale) => {
    setOpen(false);
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <Button
        type="button"
        variant="ghost"
        size={size === 'icon' ? 'icon' : 'sm'}
        aria-label="Switch language"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className={cn(size === 'sm' && 'gap-1.5 px-2.5')}
      >
        <Languages className="size-4" />
        {size === 'sm' ? <span className="text-xs font-semibold">{LOCALE_LABELS[locale]}</span> : null}
      </Button>
      {open ? (
        <div
          role="listbox"
          aria-label="Language"
          className="absolute right-0 z-50 mt-1.5 min-w-[9.5rem] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-soft-md"
        >
          {locales.map((code) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={code === locale}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                code === locale
                  ? 'bg-primary/10 font-semibold text-primary'
                  : 'text-foreground hover:bg-muted',
              )}
              onClick={() => switchLocale(code)}
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
